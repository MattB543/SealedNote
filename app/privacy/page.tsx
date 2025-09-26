"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-off-white rounded-lg shadow-sm p-6 mb-6 paper-bg">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="prose prose-gray max-w-none">
            <div className="space-y-6 text-gray-700">
              <h1
                id="sealednote-inc-privacy-policy"
                className="text-3xl font-bold text-[#424133] mb-4"
              >
                SealedNote Inc. Privacy Policy
              </h1>
              <p>
                <strong>Last Updated:</strong> September 25, 2025
              </p>
              <p>
                This Privacy Policy explains how{" "}
                <strong>SealedNote Inc.</strong> (&quot;
                <strong>SealedNote</strong>&quot;, &quot;<strong>we</strong>
                &quot;, &quot;<strong>our</strong>&quot;) handles information in
                connection with our anonymous feedback platform and related
                websites, apps, and services (collectively, the{" "}
                <strong>Service</strong>).
              </p>
              <blockquote>
                <p>
                  <strong>Plain-English promise:</strong> We designed SealedNote
                  to avoid collecting unnecessary data. Senders can submit
                  feedback without creating an account and without tracking.
                  Where encryption is enabled, message contents are end‑to‑end
                  encrypted and we cannot decrypt them.
                </p>
              </blockquote>
              <hr />
              <h2
                id="1-who-is-the-controller-and-what-does-this-policy-cover-"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                1) Who is the controller and what does this policy cover?
              </h2>
              <p>
                SealedNote Inc., is the controller of information processed
                through the Service (unless a separate agreement says
                otherwise). This policy does <strong>not</strong> cover
                third‑party websites or services that are not under our control.
              </p>
              <hr />
              <h2
                id="2-what-we-do-not-collect-or-store"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                2) What we <strong>do not</strong> collect or store
              </h2>
              <ul>
                <li>IP addresses in our application databases.</li>
                <li>Device fingerprints or browser tracking identifiers.</li>
                <li>
                  Account profile data for message senders (names, phone
                  numbers, addresses).
                </li>
                <li>
                  Behavioral tracking, analytics beacons, or cross‑site
                  tracking.
                </li>
                <li>Third‑party analytics tools.</li>
                <li>
                  Any technical capability to identify the message sender
                  (unless the sender includes such info in the message itself).
                </li>
              </ul>
              <blockquote>
                <p>
                  <strong>Hosting telemetry.</strong> Our hosting/CDN providers
                  may temporarily process IP addresses and similar connection
                  data to route traffic and mitigate abuse. We do not
                  re‑identify or store that telemetry.
                </p>
              </blockquote>
              <hr />
              <h2
                id="3-what-we-do-process-minimum-necessary-"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                3) What we <strong>do</strong> process (minimum necessary)
              </h2>
              <ul>
                <li>
                  <strong>Timestamps</strong> for database records.
                </li>
                <li>
                  <strong>Ephemeral rate‑limit counters</strong> (cleared
                  approximately every 60 seconds) to prevent abuse.
                </li>
                <li>
                  <strong>Recipients’ public keys</strong> for encryption.
                </li>
                <li>
                  <strong>Workspace configuration</strong> such as filtering
                  preferences and notification email addresses.
                </li>
                <li>
                  <strong>Customer account/billing data</strong> (admins only,
                  for paid tiers), like email and payment details managed by our
                  payment processor.
                </li>
              </ul>
              <p>
                We do not use this information for advertising or profiling.
              </p>
              <hr />
              <h2
                id="4-encryption-ai-processing-when-enabled-"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                4) Encryption &amp; AI processing (when enabled)
              </h2>
              <ul>
                <li>
                  <strong>End‑to‑end encryption (E2EE).</strong> When enabled,
                  messages are encrypted client‑side using a hybrid RSA‑OAEP +
                  AES‑GCM scheme.{" "}
                  <strong>
                    Private keys remain with the Customer and do not leave the
                    browser.
                  </strong>
                </li>
                <li>
                  <strong>Transport security.</strong> TLS 1.3 protects data in
                  transit.
                </li>
                <li>
                  <strong>AI filtering/coaching (optional).</strong> If enabled
                  by the Customer, message content is sent to{" "}
                  <strong>OpenRouter</strong> to access model providers for
                  classification/coaching. We instruct that content be processed{" "}
                  <strong>in‑memory only</strong>, and we do not permit the use
                  of message content for training. However, model providers have
                  their own terms; see Section 8 (Subprocessors). Customers can
                  disable AI features to avoid this processing.
                </li>
                <li>
                  <strong>Anonymity limits.</strong> Anonymity may be affected
                  by user behavior (e.g., sharing personal details), network
                  conditions, or legal processes outside our control.
                </li>
              </ul>
              <hr />
              <h2
                id="5-legal-bases-for-processing-eea-uk-swiss-users-"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                5) Legal bases for processing (EEA/UK/Swiss users)
              </h2>
              <ul>
                <li>
                  <strong>Performance of a contract</strong> (Art. 6(1)(b)) to
                  provide the Service you request.
                </li>
                <li>
                  <strong>Legitimate interests</strong> (Art. 6(1)(f)) for
                  fraud/abuse prevention, security, and product
                  integrity—balanced against your rights.
                </li>
                <li>
                  <strong>Consent</strong> (Art. 6(1)(a)) for optional AI
                  filtering/coaching.
                </li>
                <li>
                  <strong>Legal obligations</strong> (Art. 6(1)(c)) when we must
                  comply with law.
                </li>
              </ul>
              <hr />
              <h2
                id="6-retention-deletion"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                6) Retention &amp; deletion
              </h2>
              <ul>
                <li>
                  <strong>Messages:</strong> retained until the Customer deletes
                  them or closes the account.
                </li>
                <li>
                  <strong>Abuse/security logs:</strong> retained for up to{" "}
                  <strong>30 days</strong>.
                </li>
                <li>
                  <strong>Deletion window:</strong> we complete deletions within{" "}
                  <strong>7 days</strong> of a verified deletion request,
                  subject to routine backup latency.
                </li>
              </ul>
              <p>
                For anonymous submissions, we may not be able to identify the
                sender to action an individual request; senders should contact
                the receiving workspace directly.
              </p>
              <hr />
              <h2
                id="7-your-privacy-choices-rights"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                7) Your privacy choices &amp; rights
              </h2>
              <p>
                Depending on your location, you may have rights to{" "}
                <strong>
                  access, correct, delete, export (port), restrict, or object
                </strong>{" "}
                to processing. You also may have a right to{" "}
                <strong>appeal</strong> a refusal. To exercise these rights,
                email <strong>privacy@sealednote.com</strong>. If you are an
                end‑user sender, we may direct you to the Customer (workspace
                owner) because they control access to message content and keys.
              </p>
              <p>
                <strong>“Do Not Sell or Share.”</strong> We{" "}
                <strong>do not sell</strong> personal information and we{" "}
                <strong>do not share</strong> personal information for
                cross‑context behavioral advertising. We use only strictly
                necessary cookies (if any) to operate the Service.
              </p>
              <hr />
              <h2
                id="8-subprocessors-international-transfers"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                8) Subprocessors &amp; international transfers
              </h2>
              <p>
                We rely on the following third parties to operate the Service:
              </p>
              <ul>
                <li>
                  <strong>Vercel</strong> (hosting/CDN; global) – connection
                  handling and static asset delivery.
                </li>
                <li>
                  <strong>Supabase</strong> (managed Postgres and auth; US/EU
                  regions) – database and storage.
                </li>
                <li>
                  <strong>Postmark</strong> (email delivery; US/EU) –
                  transactional notifications; we do not send message bodies via
                  email.
                </li>
                <li>
                  <strong>OpenRouter</strong> (AI processing gateway;
                  provider‑specific regions) – optional AI filtering/coaching
                  when enabled.
                </li>
              </ul>
              <p>
                We may update this list by posting an updated version{" "}
                <strong>at least 30 days before</strong> the change (except for
                urgent replacements for security or continuity). Some processing
                may occur outside your country; where required, we use
                appropriate safeguards (e.g., SCCs).
              </p>
              <hr />
              <h2
                id="9-security"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                9) Security
              </h2>
              <p>
                We maintain administrative, technical, and physical safeguards
                aligned with industry practices, including least‑privilege
                access, encrypted storage/backups, and periodic access reviews.
                No system is 100% secure.
              </p>
              <p>
                <strong>No emergency use.</strong> The Service is not a crisis
                hotline or emergency service. Do not use it to report events
                presenting an immediate threat to safety—contact local emergency
                services instead.
              </p>
              <hr />
              <h2
                id="10-sensitive-data"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                10) Sensitive data
              </h2>
              <p>
                Please do not submit regulated or highly sensitive personal
                information (e.g., health, financial, government IDs) unless we
                have a written agreement permitting it.
              </p>
              <hr />
              <h2
                id="11-government-legal-requests"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                11) Government &amp; legal requests
              </h2>
              <p>
                We respond to valid legal requests that we are legally required
                to honor. If E2EE is enabled, we can only provide stored
                ciphertext and limited metadata; we do not possess decryption
                keys.
              </p>
              <hr />
              <h2
                id="12-changes-to-this-policy"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                12) Changes to this Policy
              </h2>
              <p>
                We may update this Policy from time to time. We will post the
                new date at the top and, for material changes, provide{" "}
                <strong>at least 30 days’ notice</strong> (e.g., email or
                in‑product notice) before they take effect.
              </p>
              <hr />
              <h2
                id="13-contact-us"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                13) Contact us
              </h2>
              <ul>
                <li>
                  <strong>Email:</strong> privacy@sealednote.com
                </li>
                <li>
                  <strong>Mail:</strong> SealedNote Inc.
                </li>
              </ul>
              <p>
                If you are in the EEA/UK and have unresolved concerns, you may
                lodge a complaint with your local supervisory authority.
              </p>
              <hr />
              <p>
                <em>
                  This Privacy Policy is intended to be simple and transparent.
                  It mirrors the commitments in our Terms/Appendices and will be
                  updated if our practices change.
                </em>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Questions about our privacy practices? Contact us at{" "}
              <a
                href="mailto:privacy@sealednote.com"
                className="text-[#646148] hover:underline"
              >
                privacy@sealednote.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
