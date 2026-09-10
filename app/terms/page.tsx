import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';
const LAST_UPDATED = 'September 9, 2026';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern using NeedSaaS — posting Needs, listing software, contributions, reviews, and account rules.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Link href="/" className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to NeedSaaS
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="blog-content mt-10">
        <p>
          This is a plain-language MVP version of our Terms of Service, written to be genuinely
          accurate to how NeedSaaS actually works today rather than to sound like a large
          company&apos;s boilerplate. It has <strong>not been reviewed by a lawyer</strong>. Sections
          marked below are the ones we&apos;d recommend a legal review of before scaling
          significantly beyond an early, invite-based soft launch.
        </p>

        <h2>1. What NeedSaaS is</h2>
        <p>
          NeedSaaS is a marketplace where people describe software problems they have (&quot;Needs&quot;),
          other people can upvote or financially contribute to a Need to signal how much it matters
          to them, and independent software builders can list existing products or choose to build
          something new in response to a Need. NeedSaaS is a venue that connects these parties — it
          is not itself a software development, consulting, or escrow service, and it does not
          guarantee that any Need will be built, that any listed product will meet your requirements,
          or that any contribution will result in a delivered solution.
        </p>

        <h2>2. User accounts</h2>
        <p>
          You need an account to post a Need, list a product, leave a review, or contribute to a
          reward pool. You&apos;re responsible for the accuracy of the information on your account and
          for keeping your login credentials secure. You must be old enough in your jurisdiction to
          enter into a binding agreement to use NeedSaaS. One person or organization should not
          operate multiple accounts to manipulate votes, reviews, or reward pools.
        </p>

        <h2>3. Posting a Need</h2>
        <p>
          When you post a Need, you&apos;re describing a real software problem in your own words. Needs
          should be specific and genuine — not test content, spam, or a description of something
          illegal or clearly infeasible. We may remove Needs that are spam, abusive, fraudulent, or
          that violate these Terms, and we may pin, feature, or otherwise curate Needs at our
          discretion (for example, to highlight ones with strong genuine demand).
        </p>

        <h2>4. Product listings</h2>
        <p>
          Builders may list software products they own, operate, or are otherwise authorized to
          list. A listing must accurately describe what the product does, its actual pricing model,
          and how to access it. Misrepresenting a product — including its features, pricing, or
          your relationship to it — is a violation of these Terms and grounds for removal. NeedSaaS
          does not vet, test, or endorse listed products beyond the review process described in our
          admin moderation practices; using any listed product is between you and that product&apos;s
          provider.
        </p>

        <h2>5. Builder responsibilities</h2>
        <p>
          If you list a product or respond to a Need as a builder, you&apos;re responsible for your own
          product, its support, and any commitments you make directly to users (including anything
          you say about timelines if you commit to building something). NeedSaaS is not a party to
          any agreement between a builder and a Need&apos;s poster or contributors, and does not
          guarantee that a builder who expresses interest in or commits to a Need will actually
          deliver software.
        </p>

        <h2>6. Contributions and reward pools</h2>
        <p>
          A Need may accumulate a &quot;build reward&quot; from contributions made by other users, shown as a
          dollar total on the Need&apos;s page along with a list of contributors and amounts. Contributing
          to a reward pool is a way of signaling — with money, not just a vote — that a problem
          matters to you. It is <strong>not</strong> a purchase, a guarantee of delivery, an escrow
          arrangement, or a binding commitment from any builder to build the software. We do not
          currently offer refunds of contributions once made, including if a Need is never built,
          except where required by law or where we determine in our discretion that a refund is
          appropriate (for example, in the case of a technical error). This is an early-stage,
          honesty-first mechanism, not a funded-escrow or crowdfunding-platform guarantee — please
          only contribute amounts you&apos;re comfortable with on that basis.
        </p>
        <p>
          <em>
            Flag for legal review: contribution/reward-pool refund policy, and whether this
            structure requires money-transmitter, crowdfunding, or similar regulatory treatment in
            your jurisdiction.
          </em>
        </p>

        <h2>7. Payments and refunds</h2>
        <p>
          Paid transactions on NeedSaaS — including the product listing fee and the Pro Builder
          subscription — are processed through Stripe. NeedSaaS does not store your card details.
          The current listing structure is: a builder&apos;s first product listing is free, each
          additional listing is a one-time $10 fee, and a Pro Builder subscription ($15/month or
          $99/year, billed through Stripe) removes the per-listing fee and adds additional builder
          features. These figures may change; the pricing page always reflects the current terms.
          Subscription cancellations take effect through Stripe&apos;s standard billing cycle handling.
          We do not currently guarantee refunds on listing fees or subscription payments except
          where required by law.
        </p>
        <p>
          <em>Flag for legal review: refund policy language and consumer-protection compliance for your jurisdiction(s).</em>
        </p>

        <h2>8. Reviews and prohibited content</h2>
        <p>
          Reviews must reflect a genuine experience with the product being reviewed. A product&apos;s
          own owner may not review their own product. Fake reviews, review manipulation, and content
          that is illegal, harassing, defamatory, or infringes someone else&apos;s intellectual property
          are prohibited anywhere on NeedSaaS — Needs, product listings, reviews, and profiles alike
          — and may be removed.
        </p>

        <h2>9. Moderation and account suspension</h2>
        <p>
          We may remove content or suspend or terminate accounts that violate these Terms, including
          spam, fraud, fake reviews, harassment, or attempts to manipulate votes or reward pools. We
          try to be proportionate about this, but during an early soft launch, moderation decisions
          are made manually and may not always be perfectly consistent.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          NeedSaaS is provided on an early-stage, &quot;as is&quot; basis. To the fullest extent permitted by
          law, NeedSaaS is not liable for indirect, incidental, or consequential damages arising from
          your use of the platform, including losses related to a Need not being built, a contribution
          not resulting in delivered software, or your reliance on any product listing or review. This
          section is intentionally broad for an early-stage MVP and should be reviewed and tightened
          by a lawyer before a wider public launch.
        </p>
        <p>
          <em>Flag for legal review: this entire section — limitation-of-liability language is jurisdiction-sensitive and this is a starting point, not finished legal drafting.</em>
        </p>

        <h2>11. Changes to these Terms</h2>
        <p>
          We may update these Terms as NeedSaaS evolves, especially during this early soft-launch
          period. We&apos;ll update the &quot;Last updated&quot; date above when we do. Continued use of NeedSaaS
          after a change means you accept the updated Terms.
        </p>

        <h2>12. Contact</h2>
        <p>
          <em>[Contact email to be added — not yet published while NeedSaaS is a controlled soft launch to a small early group.]</em>
        </p>
      </div>
    </div>
  );
}
