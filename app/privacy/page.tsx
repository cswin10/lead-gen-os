import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight gradient-text">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-premium">
          <CardContent className="prose prose-slate max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground">
                LeadGen OS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our lead
                generation management platform (the "Service"). Please read this privacy policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>

              <div className="text-muted-foreground space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">1.1 Information You Provide to Us</h3>
                  <p className="mb-2">We collect information that you voluntarily provide when using the Service:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> Name, email address, phone number, company name, and password</li>
                    <li><strong>Profile Information:</strong> Job title, role within your organization, profile photo</li>
                    <li><strong>Customer Data:</strong> Lead information, contact details, campaign data, call logs, notes, and other data you input into the Service</li>
                    <li><strong>Payment Information:</strong> Billing address and payment card details (processed securely through our payment processor)</li>
                    <li><strong>Communications:</strong> Information in messages, support tickets, and feedback you send to us</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">1.2 Information Automatically Collected</h3>
                  <p className="mb-2">We automatically collect certain information when you use the Service:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Usage Data:</strong> Features you use, pages you visit, time spent on pages, click data</li>
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device type</li>
                    <li><strong>Log Data:</strong> Server logs including access times, error messages, system activity</li>
                    <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity and store certain information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">1.3 Information from Third Parties</h3>
                  <p className="mb-2">We may receive information from third-party services you integrate with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Twilio:</strong> Call data, recordings, and telephony metadata when you use calling features</li>
                    <li><strong>Authentication Providers:</strong> If you sign up using a third-party service</li>
                    <li><strong>Integration Partners:</strong> Data from automation tools and other services you connect</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <div className="text-muted-foreground space-y-3">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Provide the Service:</strong> To operate, maintain, and provide features of the Service</li>
                  <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and process payments</li>
                  <li><strong>Customer Support:</strong> To respond to your requests, provide technical support, and send service-related notices</li>
                  <li><strong>Improvements:</strong> To understand how users interact with the Service and improve features and performance</li>
                  <li><strong>Analytics:</strong> To analyze usage patterns, trends, and user behavior</li>
                  <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
                  <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
                  <li><strong>Marketing:</strong> To send you updates, newsletters, and promotional materials (you can opt out at any time)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Share Your Information</h2>
              <div className="text-muted-foreground space-y-4">
                <p>We do not sell your personal information. We may share your information in the following circumstances:</p>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.1 Service Providers</h3>
                  <p>We share information with third-party vendors who perform services on our behalf:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Cloud hosting providers (database and application hosting)</li>
                    <li>Payment processors for billing and subscriptions</li>
                    <li>Telephony services (Twilio) for calling features</li>
                    <li>Analytics providers to help us improve the Service</li>
                    <li>Customer support tools</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.2 Within Your Organization</h3>
                  <p>
                    Information you input is shared with other users in your organization based on their assigned
                    roles and permissions (e.g., managers can see data for their campaigns, agents see assigned leads).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.3 Legal Requirements</h3>
                  <p>We may disclose information if required by law or in response to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Valid legal processes (subpoenas, court orders, search warrants)</li>
                    <li>Governmental or regulatory requests</li>
                    <li>Protection of our rights, property, or safety, or that of our users or the public</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.4 Business Transfers</h3>
                  <p>
                    If we are involved in a merger, acquisition, sale of assets, or bankruptcy, your information
                    may be transferred as part of that transaction.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.5 With Your Consent</h3>
                  <p>We may share information for any other purpose with your explicit consent.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <div className="text-muted-foreground space-y-3">
                <p>We implement appropriate technical and organizational security measures to protect your information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of data in transit using SSL/TLS</li>
                  <li>Encryption of sensitive data at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Employee training on data security practices</li>
                  <li>Row-level security policies in our database</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While
                  we strive to use commercially acceptable means to protect your information, we cannot guarantee
                  its absolute security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>5.1 Retention Period:</strong> We retain your information for as long as your account is
                  active or as needed to provide the Service. We will also retain and use your information as
                  necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
                </p>
                <p>
                  <strong>5.2 Deletion:</strong> When you close your account, we will delete or anonymize your
                  personal information within 30 days, unless we are required to retain it for legal or regulatory
                  reasons. You may request data deletion at any time by contacting us.
                </p>
                <p>
                  <strong>5.3 Backups:</strong> Information may persist in backup copies for a limited period after
                  deletion but will not be readily accessible.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Privacy Rights</h2>
              <div className="text-muted-foreground space-y-3">
                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request a copy of your information in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Request restriction of processing of your information</li>
                  <li><strong>Object:</strong> Object to our processing of your personal information</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
                  <li><strong>Opt-Out:</strong> Opt out of marketing communications at any time</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us through the support channels in the Service. We will
                  respond to your request within 30 days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking Technologies</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>7.1 What We Use:</strong> We use cookies, web beacons, and similar tracking technologies
                  to collect information about your browsing activities and to personalize your experience.
                </p>
                <p>
                  <strong>7.2 Types of Cookies:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="mt-3">
                  <strong>7.3 Your Choices:</strong> Most web browsers allow you to control cookies through settings.
                  However, disabling cookies may affect the functionality of the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of
                residence. These countries may have data protection laws that are different from the laws of your
                country. We take appropriate safeguards to ensure that your information remains protected in
                accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Service is not intended for individuals under the age of 18. We do not knowingly collect
                personal information from children under 18. If we learn that we have collected personal information
                from a child under 18, we will delete that information as quickly as possible. If you believe we
                have collected information from a child under 18, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. California Privacy Rights</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  If you are a California resident, you have specific rights under the California Consumer Privacy
                  Act (CCPA):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Right to know what personal information is collected, used, shared, or sold</li>
                  <li>Right to delete personal information held by us</li>
                  <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                  <li>Right to non-discrimination for exercising your CCPA rights</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, please contact us. We will verify your identity before processing your request.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. GDPR Compliance (European Users)</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  If you are located in the European Economic Area (EEA), you have rights under the General Data
                  Protection Regulation (GDPR):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Legal basis for processing: Consent, contract performance, legitimate interests, legal obligations</li>
                  <li>Right to access, rectification, erasure, restriction, portability, and objection</li>
                  <li>Right to lodge a complaint with your local supervisory authority</li>
                  <li>Right to withdraw consent at any time</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Third-Party Links</h2>
              <p className="text-muted-foreground">
                The Service may contain links to third-party websites or services that are not owned or controlled
                by LeadGen OS. We are not responsible for the privacy practices of these third parties. We encourage
                you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Changes to This Privacy Policy</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Posting the new Privacy Policy on this page</li>
                  <li>Updating the "Last Updated" date at the top of this policy</li>
                  <li>Sending you an email notification for material changes</li>
                </ul>
                <p className="mt-3">
                  Your continued use of the Service after any changes indicates your acceptance of the updated
                  Privacy Policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Us</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy
                  practices, please contact us through:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>The support channels provided in the Service</li>
                  <li>The contact information associated with your account</li>
                </ul>
                <p className="mt-3">
                  We will respond to your inquiry within 30 days.
                </p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                By using LeadGen OS, you acknowledge that you have read and understood this Privacy Policy and
                agree to its terms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
