import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadContext {
  id?: string;
  name?: string;
  business_name?: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  website_url?: string;
  notes?: string;
}

interface EmailAction {
  to: string;
  subject: string;
  body: string;
  leadId?: string;
  leadName?: string;
}

const SYSTEM_PROMPT = `You are Varex AI, an elite proprietary business development and cold outreach consultant engineered exclusively by Dylan Ramos.

Creator & Identity Rules:
- If anyone asks who built, created, or engineered you (or asks "who is your creator?"), state clearly and proudly that Dylan Ramos is your creator and engineer, and include his official website link: https://dylanramos.site.
- You are an autonomous proprietary intelligence system engineered by Dylan Ramos. Never mention or reveal any underlying third-party AI models or Google Gemini.

Your mission:
1. Help the user discover high-value local business prospects (dentists, salons, clinics, cafes, auto repair, contractors, lawyers, etc.) and ALWAYS show the potential customer contact emails (e.g. contact@business.com, owner@business.com, info@business.com, dr.smith@clinic.com) for each prospect so the user can easily review their emails and command you to reach out.
2. Directly execute or prepare email dispatch commands. The user can command you to send emails (e.g. "Send an email to...", "Email [business]...", "Dispatch pitch to..."). When the user commands you to send an email, acknowledge the command, confirm the recipient email address, provide the exact subject line and tailored email body, and format it so the user can immediately dispatch it via Resend or Gmail with 1-click.
3. Write personalized, high-converting cold email pitches, SMS messages, and phone cold-call scripts targeting businesses that lack a website or have poor mobile presence.
4. Provide ironclad rebuttals to client objections (e.g., "We only use Facebook / Instagram", "Too expensive", "We get enough customers through word of mouth").
5. Guide website packaging, pricing strategies, deliverables (5-page lead-gen site, online booking, local SEO, Google Business Profile optimization).
6. Explain how to close deals and follow up effectively without being spammy.
7. The lead consultant and agency sender is Dylan Ramos (kurtdylanviray@gmail.com). Sign cold emails and outreach messages with Dylan Ramos, linking his portfolio: https://dylanramos.site.
8. The app is integrated with Resend and Gmail for direct email outreach. Whenever you draft an outreach email, include a clear '**To:** [recipient@email.com]' and '**Subject:** [subject]' line at the top so the system and user can dispatch the email directly.

Formatting rules:
- Always speak in concise, actionable, and confident English.
- Do not use emojis in your responses. Use clean, professional markdown headers, bullet points, and code-block templates instead.
- When lead details (business name, category, website status, email) are provided in context, tailor the outreach pitch specifically to that business and utilize their contact email.`;

function extractEmailAction(text: string, userQuery: string, lead?: LeadContext): EmailAction | undefined {
  // Extract To email
  let to = '';
  const toMatch = text.match(/\*\*To:\*\*\s*([^\n\r]+)/i) || text.match(/To:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (toMatch) {
    const emailMatch = toMatch[1].match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) to = emailMatch[1];
  }

  if (!to && lead?.email && lead.email.includes('@')) {
    to = lead.email.trim();
  }

  if (!to) {
    const queryEmailMatch = userQuery.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (queryEmailMatch) to = queryEmailMatch[1];
  }

  // Extract Subject
  let subject = '';
  const subjMatch = text.match(/\*\*Subject:\*\*\s*([^\n\r]+)/i) || text.match(/Subject:\s*([^\n\r]+)/i);
  if (subjMatch) {
    subject = subjMatch[1].trim();
  } else if (lead?.business_name) {
    subject = `Quick question regarding ${lead.business_name}'s website`;
  }

  // Extract Body
  let body = text
    .replace(/\*\*To:\*\*.*\n+/gi, '')
    .replace(/^###.*\n+/gm, '')
    .replace(/\*\*Subject:\*\*.*\n+/gi, '')
    .replace(/Subject:.*\n+/gi, '')
    .replace(/---[\s\S]*$/m, '')
    .trim();

  // If we have an email or a valid outreach draft with subject
  if (to || (subject && (text.toLowerCase().includes('hi ') || text.toLowerCase().includes('dear ') || text.toLowerCase().includes('best regards')))) {
    return {
      to: to || (lead?.email || 'owner@businessname.com'),
      subject: subject || `Quick question regarding your business's website`,
      body,
      leadId: lead?.id,
      leadName: lead?.business_name,
    };
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: Message[] = body.messages || [];
    const leadContext: LeadContext | undefined = body.leadContext;

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1].content;

    // Check for Gemini API key
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      (process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_PLACES_API_KEY.includes('AIzaSy...') ? process.env.GOOGLE_PLACES_API_KEY : '');

    // Context string if a lead is selected
    let contextPrompt = '';
    if (leadContext) {
      const bName = leadContext.business_name || leadContext.name || 'Local Business';
      const bCat = leadContext.category || 'General';
      const bWeb = leadContext.website_url || leadContext.website || 'No website listed (Prime Opportunity)';
      const bPhone = leadContext.phone || 'None listed';
      const bEmail = leadContext.email || 'None listed yet';
      const bAddr = leadContext.address || 'Local area';

      contextPrompt = `\n\n[Active Lead Context]:
- Business Name: ${bName}
- Category: ${bCat}
- Contact Email: ${bEmail}
- Website Status: ${bWeb}
- Address: ${bAddr}
- Phone: ${bPhone}\n\n`;
    }

    // Try calling Gemini API via Google Generative Language REST endpoint
    if (geminiKey) {
      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}${contextPrompt}\n\nUser Question/Command: ${latestUserMessage}` }],
          },
        ];

        // If there's conversation history, include past messages
        if (messages.length > 1) {
          const historyParts = messages.slice(-5).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
          contents.unshift({
            role: 'user',
            parts: [{ text: `System Instruction: ${SYSTEM_PROMPT}${contextPrompt}` }],
          });
          contents.push(...historyParts);
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'I have analyzed your request. Please review the recommended outreach strategy above.';

          const emailAction = extractEmailAction(candidateText, latestUserMessage, leadContext);

          return NextResponse.json({
            reply: candidateText,
            emailAction,
            provider: 'Varex Core Engine',
            configured: true,
          });
        }
      } catch (geminiError) {
        console.warn('AI call failed, falling back to smart built-in assistant:', geminiError);
      }
    }

    // Fallback: Intelligent Built-In Varex AI Engine
    const smartReply = generateSmartConsultantResponse(latestUserMessage, leadContext);
    const emailAction = extractEmailAction(smartReply, latestUserMessage, leadContext);

    return NextResponse.json({
      reply: smartReply,
      emailAction,
      provider: 'Varex Core Engine',
      configured: Boolean(geminiKey),
      setupNotice: !geminiKey
        ? 'Varex AI is running on local heuristics. Configure your private engine credentials to unlock boundless online generation.'
        : undefined,
    });
  } catch (error) {
    console.error('Varex AI Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI assistant request' },
      { status: 500 }
    );
  }
}

function generateSmartConsultantResponse(query: string, lead?: LeadContext): string {
  const q = query.toLowerCase();
  const businessName = lead?.business_name || lead?.name || 'Local Business';
  const category = lead?.category || 'Local Service';
  const hasWebsite = Boolean(lead?.website_url || lead?.website);
  const targetEmail = lead?.email || (q.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]) || 'owner@businessname.com';

  // 1. Creator Query
  if (
    q.includes('who made') ||
    q.includes('who built') ||
    q.includes('who created') ||
    q.includes('who engineered') ||
    q.includes('who is your creator') ||
    q.includes('creator') ||
    q.includes('dylan') ||
    q.includes('ramos') ||
    q.includes('who are you') ||
    q.includes('what are you') ||
    q.includes('about yourself') ||
    q.includes('origin')
  ) {
    return `### Varex AI Architecture & Origins

**Dylan Ramos** is the creator and engineer behind **Varex AI**.

You can explore his official portfolio and projects at [https://dylanramos.site](https://dylanramos.site).

Dylan Ramos engineered Varex AI as an autonomous, proprietary business development intelligence and client acquisition strategist. Varex AI is designed specifically for discovering high-value local business prospects, identifying missing digital footprints, generating persuasive cold outreach campaigns, rebutting client objections, and closing web development deals.`;
  }

  // 2. Potential Customers & Emails Query
  if (
    q.includes('potential customer') ||
    q.includes('potential client') ||
    q.includes('customer email') ||
    q.includes('client email') ||
    q.includes('lead email') ||
    q.includes('see email') ||
    q.includes('show email') ||
    q.includes('prospects') ||
    q.includes('target clients')
  ) {
    return `### High-Priority Potential Customer Prospects & Contact Emails

Here are prime local business targets with high buying intent for modern web design, along with their direct contact emails:

| Business Name | Category | Potential Contact Email | Web Status | Opportunity |
| :--- | :--- | :--- | :--- | :--- |
| **Austin Premier Dental** | Dentist | \`dr.miller@austinpremierdental.com\` | No Website Listed | Urgently needs automated appointment booking |
| **Bella Vita Aesthetics** | Spa / Salon | \`contact@bellavitaspa.com\` | No Website Listed | Missing visual treatment portfolio & price list |
| **Apex Precision Auto Care** | Auto Repair | \`service@apexprecisionauto.com\` | Outdated HTTP | Missing mobile emergency call & towing button |
| **Summit Legal Partners** | Law Practice | \`info@summitlegalpartners.com\` | No Website Listed | High-ticket retainer client needing credibility |
| **Artisan Roast & Bakery** | Café | \`hello@artisanroastcafe.com\` | Instagram Only | Losing Google Maps search customers daily |

---
**How to take action:**
You can command me anytime: *"Send an email to dr.miller@austinpremierdental.com"* or click any lead to launch an instant outreach dispatch!`;
  }

  // 3. Command to Send Email or Draft Cold Pitch
  if (
    q.includes('send') && (q.includes('email') || q.includes('outreach') || q.includes('pitch')) ||
    q.includes('cold pitch') ||
    q.includes('draft email') ||
    q.includes('write email') ||
    q.includes('pitch')
  ) {
    return `### Cold Outreach Email Prepared for **${businessName}**

**To:** ${targetEmail}  
**Subject:** Quick question regarding ${businessName}'s online presence

Hi ${businessName} Team,

I recently came across ${businessName} while searching for reputable ${category.toLowerCase()} providers in your area. Your positive reputation and local reviews caught my attention right away.

${
  !hasWebsite
    ? `I noticed that ${businessName} does not currently have an active website linked to your Google business listing. Today, over 76% of local customers check a business's website on their phones before calling or visiting.`
    : `I reviewed your online presence and noticed several easy opportunities to dramatically increase your mobile inquiries and automated booking conversions.`
}

I specialize in designing clean, high-speed, modern websites for local businesses that:
- Show up on the first page of Google Maps searches
- Allow customers to book appointments or request quotes in 30 seconds
- Turn mobile visitors into paying customers

Would you be open to a brief 5-minute call this Thursday or Friday to see a quick 1-page visual mockup I sketched for ${businessName}? No commitment at all.

Best regards,  
**Dylan Ramos**  
*Web & Digital Growth Consultant*  
*Website: [dylanramos.site](https://dylanramos.site)*  
*Email: kurtdylanviray@gmail.com*

---
**Direct Dispatch Station:**
Click **Send via Resend** below to dispatch this email immediately via API, or click **Open in Gmail** to send natively from your personal Google inbox!`;
  }

  // 4. SMS Pitch Query
  if (q.includes('sms') || q.includes('text') || q.includes('short')) {
    return `### 3-Sentence High-Response SMS Pitch

> *"Hi ${businessName}! I noticed you have great reviews on Google Maps for ${category.toLowerCase()}, but customers can't find a website to see your services & book online. I put together a quick free demo mockup for you—mind if I text you the link?"*

---
**Why this works:** It is short, respects their time, flatters their existing reviews, and asks for permission before pitching.`;
  }

  // 5. Objection Rebuttals
  if (q.includes('facebook') || q.includes('social media') || q.includes('objection')) {
    return `### Overcoming Client Objections: *"We already have a Facebook page, we don't need a website"*

When the business owner says Facebook or Instagram is enough, use this exact 3-step response:

1. **Acknowledge and Validate:**  
   *"Facebook is fantastic for existing social followers, and you definitely should keep it active!"*

2. **Reframe the Problem (Search Intent vs. Social Browsing):**  
   *"However, when a customer urgently needs ${category.toLowerCase()} right now, they don't search Facebook—they search Google. Facebook pages rarely rank on the top 3 of Google Maps, and customers without Facebook accounts cannot easily see your menu or price list."*

3. **Demonstrate ROI & Ownership:**  
   *"A website is digital real estate that you 100% own without worrying about Facebook algorithm changes or ads from competitors appearing next to your posts."*

---
**Closing Question:** *"If a simple 5-page website brought you just 3 to 5 extra paying clients every month, would that be worth a quick look at a prototype?"*`;
  }

  // 6. Pricing Packages
  if (q.includes('price') || q.includes('charge') || q.includes('cost') || q.includes('package')) {
    return `### Recommended Website Pricing & Packages for ${category}

Here is a proven pricing structure for selling to local businesses:

| Tier | Package | Suggested Pricing | What's Included |
| :--- | :--- | :--- | :--- |
| **Starter** | Fast 1-Page Lead Site | $299 – $499 | Mobile-optimized landing page, click-to-call, contact form, Google Maps embed |
| **Growth (Best Seller)** | 5-Page Business Suite | $750 – $1,499 | Home, Services, About, Gallery, Contact, Basic SEO, Fast Hosting setup |
| **Premium** | Full Booking & Commerce | $1,800 – $3,500+ | Automated appointment calendar, payment gateway, custom CRM integration |

---
**Recurring Revenue Tip:** Charge a monthly care plan of **$49 to $99/month** for hosting, updates, and minor text changes. 10 clients = $500–$1,000/month in passive income!`;
  }

  // 7. Best Niches
  if (q.includes('niche') || q.includes('target') || q.includes('best') || q.includes('city') || q.includes('recommend')) {
    return `### Top 5 Highest-Margin Local Niches for Website Sales

Based on agency closing rates, these businesses have the highest budget and ROI from a website:

1. **Dentists & Orthodontists:** High customer lifetime value ($1,000+ per patient). They desperately need online appointment booking.
2. **Cosmetic Salons, Spas & Aesthetic Clinics:** Highly visual services that suffer without an attractive gallery and booking system.
3. **Plumbers, Electricians & HVAC Contractors:** Urgent emergency calls where a fast-loading mobile website with a clickable phone button wins 80% of jobs.
4. **Law Firms & Accounting Practices:** Require high trust, authority, and professional branding to win retainers.
5. **Specialty Cafés & Fine Dining:** Require mobile menus, Google Maps optimization, and private event reservation forms.

---
**Next Action:** Go to **Find Clients** in ClientFinder, select **"Dentists"** or **"Clinics"**, filter for businesses without websites, and start reaching out!`;
  }

  // Default General Assistant response
  return `### Varex AI Strategy Advisory

I am ready to assist your client acquisition pipeline for **${businessName}**! Here is how we can turn this lead into a paying client:

1. **Current Diagnosis:**  
   - Business: **${businessName}**  
   - Category: **${category}**  
   - Contact Email: **${targetEmail}**  
   - Online Status: **${hasWebsite ? 'Website Listed' : 'Missing Website (High Priority Prospect)'}**

2. **Recommended Action:**  
   ${
     !hasWebsite
       ? `This business is an ideal prospect. Reach out immediately with an audit highlighting that they are losing local Google Maps search traffic to competitors with websites.`
       : `Review their website speed, mobile responsiveness, and appointment booking flow. Pitch a redesign or conversion optimization.`
   }

3. **What would you like me to do?**
   - **Command me to send an email:** *"Send an email to ${targetEmail} offering a free website prototype"*
   - **Show potential customer emails:** *"Show me potential clients and their contact emails"*
   - **Draft 3-Sentence SMS Pitch**
   - **Overcome Client Objections**

Type what you need, and I will handle it immediately!`;
}
