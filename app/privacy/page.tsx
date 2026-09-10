import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';
const LAST_UPDATED = 'September 9, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What information NeedSaaS collects, how it is used, and how it is processed through Supabase and Stripe.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Link href="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to NeedSaaS
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="blog-content mt-10">
        <p>
          This is a plain-language MVP version of our Privacy Policy, describing what NeedSaaS
          actually collects and how it&apos;s actually processed today. It has{' '}
          <strong>not been reviewed by a lawyer</strong>, and we do not claim compliance with any
          specific privacy framework (GDPR, CCPA, or otherwise) — see the note under Section 8.
        </p>

        <h2>1. Account information</h2>
        <p>
          When you create an account, we store the information you provide (email address, and for
          email/password signup, a hashed password never visible to us) or the information your
          identity provider shares (for Google sign-in: your name, email, and profile picture).
          We also store the profile details you add yourself — username, bio, avatar — and status
          flags like whether you&apos;re a verified or Pro Builder account.
        </p>

        <h2>2. Need and product information</h2>
        <p>
          The Needs you post, the products you list, the reviews you write, your votes, and your
          reward-pool contributions are stored and are, by design, visible to other users — NeedSaaS
          is a public marketplace, not a private tool. Don&apos;t post information in a Need or product
          listing that you don&apos;t want publicly visible.
        </p>

        <h2>3. Payment processing through Stripe</h2>
        <p>
          Payments — the product listing fee and the Pro Builder subscription — are processed by{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe</a>,
          not by NeedSaaS directly. We never see or store your full card number. We do store what
          Stripe tells us after a payment (for example, that a subscription is active, or that a
          specific product listing was paid for) so the marketplace can reflect your paid status.
        </p>

        <h2>4. Authentication through Supabase</h2>
        <p>
          Accounts, sign-in sessions, and the underlying database are handled through{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase</a>,
          our infrastructure provider. Supabase stores your account and profile data on our behalf;
          it does not use it for its own purposes.
        </p>

        <h2>5. Analytics and logging</h2>
        <p>
          We log basic usage signals to understand how the marketplace is used — for example, search
          queries (to see what people are looking for) and page views on products (to compute view
          counts shown on listings). This is operational logging to run and improve the product, not
          third-party ad-tracking.
        </p>

        <h2>6. Cookies and similar technologies</h2>
        <p>
          NeedSaaS uses the minimum cookies/local storage needed to keep you signed in between visits
          (via Supabase&apos;s authentication session). We do not currently use third-party advertising
          or cross-site tracking cookies.
        </p>

        <h2>7. Data retention and deletion</h2>
        <p>
          We retain your account and content for as long as your account exists. If you&apos;d like your
          account or data deleted, contact us (see Section 9) and we&apos;ll process the request
          manually — during this early soft-launch phase we don&apos;t yet have a fully self-service
          deletion flow. Note that some information (for example, records of a completed payment) may
          need to be retained for accounting or legal reasons even after an account deletion request.
        </p>

        <h2>8. No claimed compliance certifications</h2>
        <p>
          NeedSaaS does not currently claim compliance with GDPR, CCPA, SOC 2, or any other specific
          privacy or security framework or certification. We handle data responsibly and only for
          the purposes described above, but we want to be explicit that we are not asserting formal
          compliance we haven&apos;t verified or certified.
        </p>
        <p>
          <em>Flag for legal review: whether any specific compliance framework applies once real users outside a small controlled group are onboarded, especially if any users are in the EU/UK or California.</em>
        </p>

        <h2>9. Contact</h2>
        <p>
          <em>[Contact email to be added — not yet published while NeedSaaS is a controlled soft launch to a small early group.]</em>
        </p>
      </div>
    </div>
  );
}
