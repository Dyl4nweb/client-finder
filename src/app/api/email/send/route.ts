import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, text, html, leadId, leadName, provider } = body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'A valid recipient email address is required.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { error: 'Email subject line is required.' },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Email message content is required.' },
        { status: 400 }
      );
    }

    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'kurtdylanviray@gmail.com';
    const replyTo = process.env.RESEND_REPLY_TO || ownerEmail;

    // Clean HTML email formatting
    const emailHtml =
      html ||
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${text
          .split('\n\n')
          .map((para: string) => `<p style="margin-bottom: 14px;">${para.replace(/\n/g, '<br />')}</p>`)
          .join('')}
      </div>`;

    // OPTION A: If Gmail SMTP App Password is provided
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const gmailUser = process.env.GMAIL_USER || ownerEmail;

    if (provider === 'gmail' || (gmailPass && !process.env.RESEND_API_KEY)) {
      if (!gmailPass) {
        return NextResponse.json(
          {
            error:
              'Gmail App Password is not yet set in .env.local. Generate a 16-character App Password at https://myaccount.google.com/apppasswords to enable direct headless sending from kurtdylanviray@gmail.com, or use Resend / 1-click Gmail Web compose.',
          },
          { status: 400 }
        );
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Kurt Dylan Viray" <${gmailUser}>`,
        to: to.trim(),
        replyTo: gmailUser,
        subject: subject.trim(),
        text: text.trim(),
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        id: info.messageId,
        provider: 'Gmail SMTP',
        from: `"Kurt Dylan Viray" <${gmailUser}>`,
        to: to.trim(),
        replyTo: gmailUser,
        subject: subject.trim(),
        leadId,
        leadName,
        sentAt: new Date().toISOString(),
      });
    }

    // OPTION B: Send via Resend API
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        {
          error: 'Resend API key is not configured. Please add RESEND_API_KEY in your .env.local file.',
          configured: false,
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);

    // Resend from address:
    // Uses Kurt Dylan Viray display name; replies go directly to kurtdylanviray@gmail.com
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'Kurt Dylan Viray <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to.trim()],
      replyTo: replyTo,
      subject: subject.trim(),
      text: text.trim(),
      html: emailHtml,
    });

    if (error) {
      console.error('Resend delivery error:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to dispatch email via Resend.',
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      provider: 'Resend API',
      from: fromAddress,
      replyTo,
      to: to.trim(),
      subject: subject.trim(),
      leadId,
      leadName,
      sentAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal email server error';
    console.error('Email API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
