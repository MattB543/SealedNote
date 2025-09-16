// Server-side cryptographic utilities (Node.js only)
import "server-only";
import crypto from 'crypto'

// Server-side: Encrypt text using RSA public key (hybrid RSA-OAEP + AES-GCM)
export function encryptWithPublicKey(text: string, publicKey: string): string {
  try {
    // 1) Generate a random AES key and IV
    const aesKey = crypto.randomBytes(32)
    const iv = crypto.randomBytes(12)

    // 2) Encrypt the message with AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
    let encryptedMessage = cipher.update(text, 'utf8', 'hex')
    encryptedMessage += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    // 3) Encrypt the AES key with RSA-OAEP (SHA-256)
    const encryptedKey = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    )

    // 4) Combine: [2 bytes key length][encryptedKey][iv(12)][authTag(16)][ciphertext]
    const combined = Buffer.concat([
      Buffer.from([encryptedKey.length >> 8, encryptedKey.length & 0xff]),
      encryptedKey,
      iv,
      authTag,
      Buffer.from(encryptedMessage, 'hex'),
    ])

    return combined.toString('base64')
  } catch (error) {
    throw new Error('Failed to encrypt content')
  }
}
