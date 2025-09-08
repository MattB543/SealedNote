// Browser-side cryptographic utilities (Web Crypto API)

// Generate a random salt (hex) in the browser
export function generateSalt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const browserCrypto = {
  // Generate RSA key pair without password (returns PEM strings)
  async generateKeyPairNoPassword(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
    const publicKey = await this.exportPublicKey(keyPair.publicKey);
    const privateKeyPem = await this.exportPrivateKey(keyPair.privateKey);
    return { publicKey, privateKey: privateKeyPem };
  },
  // Generate RSA key pair (random), then encrypt private key with password for storage
  async generateKeyPair(
    password: string,
    salt: string
  ): Promise<{ publicKey: string; privateKey: string }> {
    // Generate RSA key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Export keys to PEM
    const publicKey = await this.exportPublicKey(keyPair.publicKey);
    const privateKeyPem = await this.exportPrivateKey(keyPair.privateKey);

    // Encrypt private key with password for storage
    const encryptedPrivateKey = await this.encryptPrivateKeyWithPassword(
      privateKeyPem,
      password,
      salt
    );

    return { publicKey, privateKey: encryptedPrivateKey };
  },

  async encryptPrivateKeyWithPassword(
    privateKey: string,
    password: string,
    salt: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt + "_priv"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(privateKey)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(this.uint8ToString(combined));
  },

  async decryptPrivateKeyWithPassword(
    encryptedPrivateKey: string,
    password: string,
    salt: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt + "_priv"),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const combined = Uint8Array.from(atob(encryptedPrivateKey), (c) =>
      c.charCodeAt(0)
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return decoder.decode(decrypted);
  },

  async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("spki", key);
    const exportedAsBase64 = btoa(this.uint8ToString(new Uint8Array(exported)));
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64
      .match(/.{1,64}/g)
      ?.join("\n")}\n-----END PUBLIC KEY-----`;
  },

  async exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("pkcs8", key);
    const exportedAsBase64 = btoa(this.uint8ToString(new Uint8Array(exported)));
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64
      .match(/.{1,64}/g)
      ?.join("\n")}\n-----END PRIVATE KEY-----`;
  },

  async importPrivateKey(pem: string): Promise<CryptoKey> {
    const cleaned = pem.replace(/\r/g, "");
    const match = cleaned.match(
      /-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/
    );
    if (!match) throw new Error("Invalid private key format");
    const body = match[1].replace(/\s+/g, "");
    const binaryDer = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  },

  async decrypt(
    encryptedBase64: string,
    privateKeyPem: string
  ): Promise<string> {
    try {
      const privateKey = await this.importPrivateKey(privateKeyPem);
      const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
        c.charCodeAt(0)
      );

      const keyLength = (combined[0] << 8) | combined[1];
      const encryptedKey = combined.slice(2, 2 + keyLength);

      const aesKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKey
      );
      const key = await crypto.subtle.importKey(
        "raw",
        aesKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      for (const ivLen of [12, 16]) {
        try {
          let offset = 2 + keyLength;
          const iv = combined.slice(offset, offset + ivLen);
          offset += ivLen;
          const authTag = combined.slice(offset, offset + 16);
          offset += 16;
          const encryptedMessage = combined.slice(offset);

          const ciphertext = new Uint8Array(
            encryptedMessage.length + authTag.length
          );
          ciphertext.set(encryptedMessage, 0);
          ciphertext.set(authTag, encryptedMessage.length);

          const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
          );
          return new TextDecoder().decode(decrypted);
        } catch {
          // try next ivLen
        }
      }
      throw new Error(
        "Failed to decrypt - incorrect password or corrupted data"
      );
    } catch (error) {
      throw new Error(
        "Failed to decrypt - incorrect password or corrupted data"
      );
    }
  },

  // Encrypt content in the browser using recipient's public key (matches server format)
  async encryptWithPublicKey(
    text: string,
    publicKeyPem: string
  ): Promise<string> {
    const cleaned = publicKeyPem.replace(/\r/g, "");
    const match = cleaned.match(
      /-----BEGIN PUBLIC KEY-----([\s\S]*?)-----END PUBLIC KEY-----/
    );
    if (!match) throw new Error("Invalid public key");
    const pemBody = match[1].replace(/\s+/g, "");
    const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    // Generate AES key and 12-byte IV
    const aesKeyRaw = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt message with AES-GCM
    const encoder = new TextEncoder();
    const aesKey = await crypto.subtle.importKey(
      "raw",
      aesKeyRaw,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const enc = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encoder.encode(text)
    );
    const encU8 = new Uint8Array(enc);
    const authTag = encU8.slice(encU8.length - 16);
    const encryptedMessage = encU8.slice(0, encU8.length - 16);

    // Encrypt AES key with RSA-OAEP
    const encryptedKeyBuf = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      aesKeyRaw
    );
    const encryptedKey = new Uint8Array(encryptedKeyBuf);

    // Combine: [2 bytes key length][encryptedKey][iv(12)][authTag(16)][ciphertext]
    const keyLen = encryptedKey.byteLength;
    const totalLen = 2 + keyLen + 12 + 16 + encryptedMessage.byteLength;
    const combined = new Uint8Array(totalLen);
    combined[0] = keyLen >> 8;
    combined[1] = keyLen & 0xff;
    let offset = 2;
    combined.set(encryptedKey, offset);
    offset += keyLen;
    combined.set(iv, offset);
    offset += 12;
    combined.set(authTag, offset);
    offset += 16;
    combined.set(encryptedMessage, offset);

    return btoa(this.uint8ToString(combined));
  },

  str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  },

  uint8ToString(u8: Uint8Array): string {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return s;
  },
};
