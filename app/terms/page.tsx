"use client";

import Link from "next/link";

export default function TermsOfService() {
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
                id="sealednote-inc-cloud-service-agreement-cover-page-common-paper-v2-1-"
                className="text-3xl font-bold text-[#424133] mb-4"
              >
                Terms of Service
              </h1>
              <p>
                <strong>Last Updated:</strong> September 25, 2025
              </p>
              <p>
                If you signed a separate Cover Page to access the Product with
                the same account, and that agreement has not ended, the terms
                below do not apply. Instead, your separate Cover Page applies to
                your use of the Product.
              </p>
              <p>
                This Agreement is between <strong>SealedNote Inc.</strong> (the{" "}
                <strong>Provider</strong>) and the company or person accessing
                or using the Product (the <strong>Customer</strong>). This
                Agreement consists of (1) this Cover Page (Order Form + Key
                Terms) and (2) the <strong>Framework Terms</strong> defined
                below.
              </p>
              <p>
                If you are accessing or using the Product on behalf of your
                company, you represent that you are authorized to accept this
                Agreement on behalf of your company. By signing up, accessing,
                or using the Product, Customer accepts this Agreement.
              </p>
              <hr />
              <h2
                id="order-form"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Order Form
              </h2>
              <p>
                <strong>Framework Terms.</strong> This Cover Page incorporates
                and is governed by the Framework Terms made up of the{" "}
                <strong>Key Terms</strong> below and the Common Paper{" "}
                <strong>Cloud Service Agreement Standard Terms v2.1</strong>{" "}
                (the <strong>Standard Terms</strong>), which are incorporated by
                reference:{" "}
                <a href="https://commonpaper.com/standards/cloud-service-agreement/2.1/">
                  https://commonpaper.com/standards/cloud-service-agreement/2.1/
                </a>
                . Any modifications to the Standard Terms made in this Cover
                Page control over any conflict with the Standard Terms.
                Capitalized terms have the meanings given in this Cover Page or
                the Standard Terms.
              </p>
              <p>
                <strong>Cloud Service.</strong> <strong>SealedNote</strong> is
                an anonymous feedback platform with optional end‑to‑end
                encryption for messages. Key features include AI‑assisted
                guidance for constructive feedback, configurable filtering,
                optional auto‑deletion of filtered comments, and sender privacy
                controls. <strong>Encryption boundary.</strong> When enabled,
                messages are encrypted client‑side to recipients’ public keys;
                Provider does not possess the private keys.{" "}
                <strong>AI filtering.</strong> If Customer enables AI filtering,
                message content may be sent to third‑party model providers for
                classification as described in Appendix A (Security &amp;
                Encryption Summary). Customer is responsible for configuring
                features consistent with its privacy requirements.
              </p>
              <p>
                <strong>Order Date.</strong> The <strong>Effective Date</strong>
                .
              </p>
              <p>
                <strong>Subscription Period.</strong>
              </p>
              <ul>
                <li>
                  <strong>Free Tier:</strong> No fixed subscription period;
                  terminable at will per the Standard Terms.
                </li>
                <li>
                  <strong>Paid Tiers (if selected):</strong> 1 month,
                  auto‑renewing unless terminated per{" "}
                  <strong>Non‑Renewal Notice Period</strong> below.
                </li>
              </ul>
              <p>
                <strong>Cloud Service Fees.</strong>
              </p>
              <ul>
                <li>
                  <strong>Free Tier:</strong> $0.
                </li>
                <li>
                  <strong>Paid Tiers (if selected):</strong> As listed on
                  Provider’s pricing page:{" "}
                  <a href="https://www.sealednote.com/pricing">
                    https://www.sealednote.com/pricing
                  </a>
                  . Provider may update paid pricing with at least 30 days’
                  notice (including by email or within the Product). Price
                  changes apply in the next Subscription Period.{" "}
                  <strong>Fees are inclusive of taxes</strong> unless the
                  invoice states otherwise.
                </li>
              </ul>
              <p>
                <strong>Payment Process (applies only to paid tiers).</strong>{" "}
                Customer authorizes Provider to charge the payment method on
                file <strong>monthly</strong> for immediate payment without
                further approval.
              </p>
              <p>
                <strong>Non‑Renewal Notice Period (paid tiers only).</strong> At
                least 30 days before the end of the then‑current Subscription
                Period.
              </p>
              <p>
                <strong>Service Levels.</strong> No uptime/service‑credit
                commitment for the Free Tier. Any paid‑tier SLAs will be stated
                (if applicable) on the pricing page and are incorporated by
                reference.
              </p>
              <p>
                <strong>Security Policy; AUP; Subprocessors.</strong> The
                Security &amp; Encryption Summary (Appendix A), Acceptable Use
                Policy (Appendix B), and Subprocessors List (Appendix C) are
                incorporated by reference and form part of the Framework Terms.
              </p>
              <hr />
              <h2
                id="key-terms"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Key Terms
              </h2>
              <p>
                <strong>Customer.</strong> The company or person who accesses or
                uses the Product. If the person accepting this Agreement does so
                on behalf of a company, all references to{" "}
                <strong>Customer</strong> mean that company.
              </p>
              <p>
                <strong>Provider.</strong> SealedNote Inc.
              </p>
              <p>
                <strong>Effective Date.</strong> The date Customer first accepts
                this Agreement.
              </p>
              <p>
                <strong>Governing Law.</strong> The laws of the State of
                Delaware, USA,{" "}
                <strong>without regard to conflict‑of‑laws principles</strong>.
              </p>
              <p>
                <strong>Chosen Courts.</strong> The state or federal courts
                located in Delaware, and the parties consent to their exclusive
                jurisdiction and venue{" "}
                <strong>
                  except where prohibited by applicable law for consumers
                </strong>
                .
              </p>
              <p>
                <strong>Covered Claims.</strong>
              </p>
              <ul>
                <li>
                  <strong>Provider Covered Claims.</strong> Any action,
                  proceeding, or claim that the Cloud Service, when used by
                  Customer according to the Agreement, violates,
                  misappropriates, or infringes another party’s intellectual
                  property or proprietary rights.
                </li>
                <li>
                  <strong>Customer Covered Claims.</strong> Any action,
                  proceeding, or claim (1) that the{" "}
                  <strong>Customer Content</strong>, when used according to the
                  Agreement, violates, misappropriates, or infringes another
                  party’s intellectual property or proprietary rights; or (2)
                  arising from Customer’s breach or alleged breach of Section
                  2.1 (Restrictions on Customer) of the Standard Terms or
                  Appendix B (AUP).
                </li>
              </ul>
              <p>
                <strong>General Cap Amount (modifies Standard Terms).</strong>{" "}
                The{" "}
                <strong>
                  greater of (a) $100 and (b) the fees paid or payable by
                  Customer to Provider in the 12‑month period immediately before
                  the event giving rise to the claim
                </strong>
                . The exclusions and carve‑outs in the Standard Terms (e.g., for
                uncapped indemnity obligations specified therein) still apply.
              </p>
              <p>
                <strong>Notice Address.</strong>
              </p>
              <ul>
                <li>
                  <strong>Provider:</strong> notices@sealednote.com and{" "}
                  <strong>SealedNote Inc.</strong>.
                </li>
                <li>
                  <strong>Customer:</strong> The primary email address on
                  Customer’s account. Customer agrees that in‑product and email
                  notices constitute written notice.
                </li>
              </ul>
              <p>
                <strong>Age Requirement.</strong> The Product is not intended
                for use by individuals under 16. Customer represents that all
                end users are at least 16 years old (or the minimum age required
                by local law, if higher).
              </p>
              <p>
                <strong>Publicity.</strong> Provider may not use Customer’s name
                or marks without Customer’s prior written consent, except to
                identify Customer’s account in administrative contexts.
              </p>
              <hr />
              <h1
                id="appendix-a-security-encryption-summary-incorporated-policy-"
                className="text-3xl font-bold text-[#424133] mt-12 mb-4"
              >
                Appendix A — Security &amp; Encryption Summary
              </h1>
              <p>
                This Appendix describes the Product’s security and data‑handling
                at a high level. It supplements the Standard Terms and controls
                over any conflict with marketing materials.
              </p>
              <h2
                id="data-minimization"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Data Minimization
              </h2>
              <p>
                <strong>We do not</strong> intentionally collect or store:
                account profile data (unless provided by Customer), device
                fingerprints, behavioral tracking or session data, third‑party
                analytics, or sender identification data.{" "}
                <strong>We do not store IP addresses</strong> in our application
                databases.
              </p>
              <p>
                <strong>We do</strong> process minimal metadata necessary to
                provide the Service:
              </p>
              <ul>
                <li>Timestamps for database records.</li>
                <li>
                  Ephemeral rate‑limit counters (cleared every ~60 seconds).
                </li>
                <li>Recipients’ public keys for encryption.</li>
                <li>
                  Workspace configuration (e.g., filtering preferences,
                  notification email addresses).
                </li>
              </ul>
              <p>
                <strong>Network and hosting telemetry.</strong> Our hosting and
                CDN providers may temporarily process IP addresses and similar
                connection data for routing, delivery, and abuse mitigation.
                Provider does not retain or reidentify this telemetry.
              </p>
              <h2
                id="encryption-key-management"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Encryption &amp; Key Management
              </h2>
              <ul>
                <li>
                  End‑to‑end hybrid encryption (RSA‑OAEP + AES‑GCM) is
                  available; private keys are generated and remain client‑side.
                </li>
                <li>Transit encryption via TLS 1.3.</li>
                <li>
                  Encrypted payload storage: ciphertext is stored server‑side
                  when E2EE is enabled; Provider cannot decrypt without
                  Customer‑held keys.
                </li>
              </ul>
              <h2
                id="ai-filtering-optional-"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                AI Filtering (Optional)
              </h2>
              <p>
                If enabled by Customer, message content may be transmitted to
                third‑party AI model providers for classification and coaching.
                Such processing occurs transiently and is not used by Provider
                for advertising or profiling. See Appendix C (Subprocessors) for
                current providers.{" "}
                <strong>
                  Customer can disable AI filtering to avoid this processing.
                </strong>
              </p>
              <h2
                id="retention-deletion"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Retention &amp; Deletion
              </h2>
              <ul>
                <li>
                  <strong>Messages:</strong> retained until Customer deletes
                  them or closes the account.
                </li>
                <li>
                  <strong>Abuse/security logs:</strong> retained up to{" "}
                  <strong>30 days</strong>.
                </li>
                <li>
                  <strong>Deletion window:</strong> within{" "}
                  <strong>7 days</strong> of a verified deletion request,
                  subject to standard backup latency.
                </li>
              </ul>
              <h2
                id="security-practices"
                className="text-2xl font-semibold text-[#424133] mt-8 mb-3"
              >
                Security Practices
              </h2>
              <ul>
                <li>
                  SOC 2‑aligned controls via hosting providers; periodic access
                  reviews; least‑privilege access; encrypted backups.
                </li>
                <li>No sale or sharing of personal information.</li>
                <li>
                  Data locality as provided by hosting/CDN; Customer should not
                  upload regulated data (e.g., PHI, PCI) without a separate
                  written agreement.
                </li>
              </ul>
              <hr />
              <h1
                id="appendix-b-acceptable-use-policy-incorporated-policy-"
                className="text-3xl font-bold text-[#424133] mt-12 mb-4"
              >
                Appendix B — Acceptable Use Policy
              </h1>
              <p>
                To keep the Service safe and lawful, Customer and its end users
                must not:
              </p>
              <ul>
                <li>
                  Post content that is unlawful, infringing, defamatory,
                  harassing, hateful, or that discloses others’ personal or
                  confidential information (including doxxing).
                </li>
                <li>
                  Upload malware, attempt to exploit, probe, or disrupt the
                  Service or others’ systems, or bypass security or rate limits.
                </li>
                <li>Use the Service for spam, scams, or deceptive activity.</li>
                <li>
                  Use the Service to report emergencies or imminent threats.{" "}
                  <strong>
                    The Service is not a crisis hotline or emergency service.
                  </strong>{" "}
                  Call local emergency services instead.
                </li>
              </ul>
              <p>
                <strong>Enforcement.</strong> Provider may remove content,
                throttle functionality, or suspend or terminate access for
                violations. Provider does not undertake an obligation to monitor
                content but may do so at its discretion. Customer is responsible
                for end‑user conduct.
              </p>
              <p>
                <strong>Notice/Takedown.</strong> Report suspected violations to
                abuse@sealednote.com. Provider may disable or remove content at
                its discretion and will, where feasible, notify Customer.
              </p>
              <hr />
              <h1
                id="appendix-c-subprocessors-incorporated-list-"
                className="text-3xl font-bold text-[#424133] mt-12 mb-4"
              >
                Appendix C — Subprocessors
              </h1>
              <p>
                Current third‑party subprocessors used to provide the Service:
              </p>
              <ul>
                <li>
                  <strong>Vercel</strong> (hosting/CDN; global) — connection
                  handling and static asset delivery.
                </li>
                <li>
                  <strong>Supabase</strong> (managed Postgres and auth; US/EU
                  regions) — database and storage.
                </li>
                <li>
                  <strong>Postmark</strong> (email delivery; US/EU) —
                  transactional notifications; no message body content.
                </li>
                <li>
                  <strong>OpenRouter</strong> (AI processing gateway; region per
                  provider) — optional AI filtering/classification when enabled.
                </li>
              </ul>
              <p>
                Provider may update this list from time to time by posting an
                updated version not less than 30 days before the change takes
                effect (except for urgent replacements for security or
                continuity). Customer may object per the Standard Terms.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Questions about our terms? Contact us at{" "}
              <a
                href="mailto:support@sealednote.com"
                className="text-[#646148] hover:underline"
              >
                support@sealednote.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
