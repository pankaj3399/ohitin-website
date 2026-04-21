import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const PRIVACY_CONTACT_EMAIL = 'ohitin@gmail.com';

const SITE_NAME = 'Ohitin';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-12 font-inter text-xl font-semibold tracking-tight text-white first:mt-0 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 font-inter text-[15px] leading-relaxed text-neutral-300">
        {children}
      </div>
    </section>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-200/90 underline decoration-amber-200/30 underline-offset-4 transition hover:text-amber-100 hover:decoration-amber-100/60"
    >
      {children}
    </a>
  );
}

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = `Privacy Policy | ${SITE_NAME}`;
    const existing = document.querySelector('meta[name="description"]');
    if (existing instanceof HTMLMetaElement) {
      existing.content = `Privacy Policy for ${SITE_NAME}, including Instagram and Meta-related services.`;
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = `Privacy Policy for ${SITE_NAME}, including Instagram and Meta-related services.`;
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-200">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <p className="font-inter text-sm font-medium text-white">{SITE_NAME}</p>
          <Link
            to="/"
            className="font-inter text-sm text-amber-200/90 transition hover:text-amber-100"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-6">
        <h1 className="font-inter text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 font-inter text-sm text-neutral-400">
          Last updated: April 22, 2026
        </p>
        <p className="mt-6 font-inter text-[15px] leading-relaxed text-neutral-300">
          This Privacy Policy describes how {SITE_NAME} (“we,” “us,” or “our”) collects, uses, discloses,
          and protects information when you use our website, related digital experiences, and optional
          Instagram-related features we operate in connection with a Meta / Instagram Business integration
          (including automated messaging or lead workflows). By using our services, you agree to this
          policy. If you do not agree, please do not use our services.
        </p>

        <Section id="meta" title="Meta and Instagram platform use">
          <p>
            Where our services interact with Instagram or other Meta products, our use of Meta technologies
            is also subject to Meta’s applicable terms, policies, and product documentation. For convenience,
            you may review Meta’s and Instagram’s public policies here:{' '}
            <ExternalLink href="https://www.facebook.com/privacy/policy">Meta Privacy Policy</ExternalLink>
            {', '}
            <ExternalLink href="https://privacycenter.instagram.com/policy/">
              Instagram Data Policy
            </ExternalLink>
            {', '}
            <ExternalLink href="https://www.facebook.com/legal/terms">Meta Terms of Service</ExternalLink>
            {', and '}
            <ExternalLink href="https://developers.facebook.com/terms/">
              Meta Platform Terms for Developers
            </ExternalLink>
            . We use Instagram / Meta APIs and related features only as permitted for our app configuration,
            approved permissions, and documented use cases, and we do not sell your personal information.
          </p>
        </Section>

        <Section id="collect" title="Information we collect">
          <p>
            <span className="font-medium text-white">You provide directly:</span> for example, messages you
            send us, information you submit through forms, or account details you provide for authorized
            administrative access.
          </p>
          <p>
            <span className="font-medium text-white">Automatically:</span> for example, basic technical data
            such as device/browser type, general location derived from IP (if available), timestamps, and
            diagnostic logs needed to operate and secure the service.
          </p>
          <p>
            <span className="font-medium text-white">From Instagram / Meta (when enabled):</span> depending
            on the permissions granted to our integration, this may include Instagram Business account
            identifiers, messaging metadata, message content in conversations with our Page or connected
            experience, participant identifiers (such as Instagram-scoped IDs where applicable), and
            profile fields made available through the APIs we use. We only request and retain data that is
            reasonably necessary to provide the features you interact with (for example, responding to
            messages, routing inquiries, and measuring basic engagement for operational purposes).
          </p>
        </Section>

        <Section id="use" title="How we use information">
          <ul className="list-disc space-y-2 pl-5 marker:text-neutral-500">
            <li>Provide, maintain, improve, and secure our website and related services.</li>
            <li>Operate Instagram messaging, automation, or lead-handling features you initiate or consent to.</li>
            <li>Communicate with you about the service, respond to requests, and provide support.</li>
            <li>Detect, investigate, and help prevent fraud, abuse, security issues, or violations of law or policy.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </Section>

        <Section id="legal-bases" title="Legal bases (where applicable)">
          <p>
            If data protection laws such as the GDPR apply, we may rely on one or more of the following
            legal bases: performance of a contract, legitimate interests (for example securing our systems
            and improving reliability, balanced against your rights), consent where required, and compliance
            with legal obligations.
          </p>
        </Section>

        <Section id="share" title="How we share information">
          <p>
            We may share information with service providers who process data on our behalf under
            appropriate safeguards (for example hosting, infrastructure, analytics, or communications
            vendors). We may also share information when required by law, to protect rights and safety, or
            in connection with a business transfer subject to safeguards.
          </p>
          <p>
            Information processed through Meta / Instagram is also subject to Meta’s infrastructure and
            policies. Meta may process certain data as described in Meta’s policies linked above.
          </p>
        </Section>

        <Section id="retention" title="Retention">
          <p>
            We retain information only as long as needed for the purposes described in this policy, unless a
            longer retention period is required or permitted by law. Retention periods can vary based on the
            nature of the data and operational needs (for example security logs, message history for
            support, or legal holds).
          </p>
        </Section>

        <Section id="security" title="Security">
          <p>
            We implement reasonable administrative, technical, and organizational measures designed to
            protect personal information. No method of transmission or storage is completely secure; we
            cannot guarantee absolute security.
          </p>
        </Section>

        <Section id="rights" title="Your choices and rights">
          <p>
            Depending on your location, you may have rights to access, correct, delete, or restrict certain
            processing of your personal information, and to object to certain processing or request data
            portability. You may also have the right to lodge a complaint with a supervisory authority.
          </p>
          <p>
            For Meta / Instagram data, you can also review and adjust certain settings in your Instagram and
            Facebook accounts, including permissions granted to connected apps, as described in Meta’s help
            documentation.
          </p>
          <p>
            To exercise privacy rights related to our processing, contact us at{' '}
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
              className="text-amber-200/90 underline decoration-amber-200/30 underline-offset-4 hover:text-amber-100"
            >
              {PRIVACY_CONTACT_EMAIL}
            </a>
            . We may need to verify your request before responding.
          </p>
        </Section>

        <Section id="children" title="Children">
          <p>
            Our services are not directed to children under 13 (or the minimum age required in your
            jurisdiction), and we do not knowingly collect personal information from children. If you
            believe we have collected information from a child, please contact us and we will take
            appropriate steps to investigate and delete it where required.
          </p>
        </Section>

        <Section id="international" title="International transfers">
          <p>
            We may process and store information in countries other than where you live. Where required, we
            use appropriate safeguards for cross-border transfers consistent with applicable law.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on this
            page and update the “Last updated” date. If changes are material, we will provide additional
            notice as required by law.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions about this Privacy Policy:{' '}
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
              className="text-amber-200/90 underline decoration-amber-200/30 underline-offset-4 hover:text-amber-100"
            >
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-16 border-t border-white/10 pt-8 font-inter text-sm leading-relaxed text-neutral-500">
          This policy is intended to support common app review and platform disclosure requirements, but it
          does not constitute legal advice. You should have qualified counsel review your final policy and
          practices, especially if you change data processing, permissions, or regions you serve.
        </p>
      </main>
    </div>
  );
}
