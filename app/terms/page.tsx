import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Scale className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight gradient-text">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-premium">
          <CardContent className="prose prose-slate max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using LeadGen OS (the "Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these Terms of Service, please do not use
                the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                LeadGen OS provides a multi-tenant software-as-a-service platform for lead generation agencies.
                The Service includes tools for lead management, campaign tracking, team coordination, client
                reporting, and calling capabilities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>3.1 Account Creation:</strong> You must create an account to use the Service. You agree
                  to provide accurate, current, and complete information during the registration process.
                </p>
                <p>
                  <strong>3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur under your account.
                </p>
                <p>
                  <strong>3.3 Account Termination:</strong> We reserve the right to suspend or terminate your account
                  if you violate these Terms of Service or engage in fraudulent or illegal activities.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. User Data and Privacy</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>4.1 Your Data:</strong> You retain all rights to data you submit to the Service. We claim
                  no ownership over your customer data, leads, or campaign information.
                </p>
                <p>
                  <strong>4.2 Data Security:</strong> We implement industry-standard security measures to protect your
                  data. However, no method of transmission over the Internet is 100% secure.
                </p>
                <p>
                  <strong>4.3 Privacy Policy:</strong> Your use of the Service is also governed by our Privacy Policy,
                  which is incorporated into these Terms by reference.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
              <div className="text-muted-foreground space-y-3">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Service for any illegal purposes or in violation of any laws</li>
                  <li>Transmit any viruses, malware, or other malicious code</li>
                  <li>Attempt to gain unauthorized access to the Service or related systems</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service to harass, abuse, or harm another person</li>
                  <li>Violate any applicable telemarketing or anti-spam laws (TCPA, CAN-SPAM, etc.)</li>
                  <li>Collect or store personal data about other users without their consent</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Calling and Communications Compliance</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>6.1 Legal Compliance:</strong> You are solely responsible for ensuring your use of the
                  calling features complies with all applicable laws, including the Telephone Consumer Protection
                  Act (TCPA), CAN-SPAM Act, and any state or international regulations.
                </p>
                <p>
                  <strong>6.2 Consent:</strong> You must obtain proper consent from contacts before calling them
                  through the Service.
                </p>
                <p>
                  <strong>6.3 Do Not Call Lists:</strong> You are responsible for maintaining and respecting Do Not
                  Call list compliance.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Payment Terms</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>7.1 Subscription Fees:</strong> Access to the Service requires payment of subscription fees
                  as specified in your selected plan.
                </p>
                <p>
                  <strong>7.2 Billing:</strong> Subscription fees are billed in advance on a recurring basis (monthly
                  or annually) depending on your plan.
                </p>
                <p>
                  <strong>7.3 Refunds:</strong> Subscription fees are non-refundable except as required by law or as
                  explicitly stated in your subscription agreement.
                </p>
                <p>
                  <strong>7.4 Late Payment:</strong> Failure to pay subscription fees may result in suspension or
                  termination of your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>8.1 Service Ownership:</strong> The Service, including its design, code, features, and
                  content, is owned by LeadGen OS and is protected by copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p>
                  <strong>8.2 Limited License:</strong> We grant you a limited, non-exclusive, non-transferable
                  license to access and use the Service for your business purposes.
                </p>
                <p>
                  <strong>8.3 Restrictions:</strong> You may not copy, modify, distribute, sell, or lease any part
                  of the Service, nor may you reverse engineer or attempt to extract the source code.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Third-Party Services</h2>
              <p className="text-muted-foreground">
                The Service may integrate with third-party services (such as Twilio for calling). Your use of
                third-party services is subject to their respective terms of service and privacy policies. We are
                not responsible for third-party services or their content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Disclaimers and Limitation of Liability</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>10.1 "AS IS" Basis:</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND,
                  EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
                <p>
                  <strong>10.2 Limitation of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEADGEN OS
                  SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
                  ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
                  GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
                <p>
                  <strong>10.3 Maximum Liability:</strong> Our total liability to you for all claims arising from or
                  related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding
                  the claim.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless LeadGen OS, its officers, directors, employees,
                and agents from and against any claims, liabilities, damages, losses, and expenses arising out of
                or in any way connected with your access to or use of the Service, your violation of these Terms,
                or your violation of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Modifications to Service and Terms</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>12.1 Service Changes:</strong> We reserve the right to modify or discontinue the Service
                  (or any part thereof) at any time with or without notice.
                </p>
                <p>
                  <strong>12.2 Terms Changes:</strong> We may update these Terms from time to time. We will notify
                  you of any material changes by posting the new Terms on this page and updating the "Last Updated"
                  date.
                </p>
                <p>
                  <strong>12.3 Continued Use:</strong> Your continued use of the Service after any such changes
                  constitutes your acceptance of the new Terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Termination</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>13.1 By You:</strong> You may terminate your account at any time by contacting us or
                  through your account settings.
                </p>
                <p>
                  <strong>13.2 By Us:</strong> We may terminate or suspend your account immediately, without prior
                  notice, for any reason, including if you breach these Terms.
                </p>
                <p>
                  <strong>13.3 Effect of Termination:</strong> Upon termination, your right to use the Service will
                  immediately cease. You may request an export of your data within 30 days of termination.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Governing Law and Dispute Resolution</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>14.1 Governing Law:</strong> These Terms shall be governed by and construed in accordance
                  with the laws of the jurisdiction in which LeadGen OS is registered, without regard to its conflict
                  of law provisions.
                </p>
                <p>
                  <strong>14.2 Disputes:</strong> Any dispute arising from these Terms or the Service shall be resolved
                  through binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">15. General Provisions</h2>
              <div className="text-muted-foreground space-y-3">
                <p>
                  <strong>15.1 Entire Agreement:</strong> These Terms constitute the entire agreement between you and
                  LeadGen OS regarding the Service.
                </p>
                <p>
                  <strong>15.2 Severability:</strong> If any provision of these Terms is found to be unenforceable,
                  the remaining provisions will continue in full force and effect.
                </p>
                <p>
                  <strong>15.3 Waiver:</strong> The failure of LeadGen OS to enforce any right or provision of these
                  Terms will not be deemed a waiver of such right or provision.
                </p>
                <p>
                  <strong>15.4 Assignment:</strong> You may not assign or transfer these Terms without our prior
                  written consent. We may assign our rights and obligations without restriction.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">16. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through the support
                channels provided in the Service.
              </p>
            </section>

            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                By using LeadGen OS, you acknowledge that you have read, understood, and agree to be bound by
                these Terms of Service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
