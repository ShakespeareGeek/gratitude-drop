export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Effective: February 13, 2026</p>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            The Daily Gratitude Drop ("Gratitude Drop," "we," "our") is operated by Duane. This
            policy explains what information we collect and how we use it.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">What we collect</h2>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Gratitude notes you submit.</strong> When you submit a note, we store the
              text. Notes are anonymous — we do not collect your name, email, or any account
              information.
            </li>
            <li>
              <strong>IP addresses.</strong> We temporarily log your IP address to enforce rate
              limits (currently 5 submissions per hour). IP addresses are not stored long-term or
              associated with submitted notes.
            </li>
            <li>
              <strong>Local preferences.</strong> We use your browser&apos;s or device&apos;s local
              storage to remember which notes you&apos;ve liked. This data stays on your device and
              is never sent to our servers.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">What we do not collect</h2>

          <ul className="list-disc pl-6 space-y-2">
            <li>We do not require accounts or collect emails, names, or passwords.</li>
            <li>We do not use analytics, advertising trackers, or third-party cookies.</li>
            <li>We do not sell, share, or rent any data to third parties.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">Third-party services</h2>

          <p>
            Our backend runs on Cloudflare Workers and uses Cloudflare D1 for storage. Cloudflare
            may process requests in accordance with their own{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              className="text-emerald-600 hover:text-emerald-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
            . Our website is hosted on Vercel, subject to their{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              className="text-emerald-600 hover:text-emerald-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">Children&apos;s privacy</h2>

          <p>
            Gratitude Drop is not directed at children under 13. We do not knowingly collect
            information from children under 13.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">Changes to this policy</h2>

          <p>
            We may update this policy from time to time. Changes will be posted on this page with a
            revised effective date.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 pt-2">Contact</h2>

          <p>
            Questions? Reach us at{" "}
            <a
              href="mailto:feedback@gratitudedrop.com"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              feedback@gratitudedrop.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
