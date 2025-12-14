// app/api/send-otp/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, otp, isAdmin } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('Attempting to send OTP to:', email);
    console.log('OTP:', otp);
    console.log('Is Admin:', isAdmin);
    console.log('API Key exists:', !!process.env.RESEND_API_KEY);

    // Different email templates for admin vs regular users
    const emailTemplate = isAdmin ? getAdminOTPTemplate(otp) : getRegularOTPTemplate(otp);
    const subject = isAdmin ? 'Admin Login Verification - Bulky' : 'Your Login Code - Bulky';

    const { data, error } = await resend.emails.send({
      from: 'Bulky <onboarding@resend.dev>', // Use this for testing
      to: email,
      subject: subject,
      html: emailTemplate
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
     console.log('Email sent successfully:', data);
     return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

function getRegularOTPTemplate(otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e293b; margin: 0;">Your Login Code</h1>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        Use this code to sign in to your Bulky account:
      </p>
      
      <div style="background: linear-gradient(135deg, #1e293b 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
        <div style="color: white; font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
          ${otp}
        </div>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        This code will expire in <strong>10 minutes</strong>.
      </p>
      
      <p style="color: #64748b; font-size: 14px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Sent by Bulky Email Campaign Manager
        </p>
      </div>
    </div>
  `;
}

function getAdminOTPTemplate(otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);">
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 15px; border-radius: 50%; margin-bottom: 20px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">Admin Verification Required</h1>
          <p style="color: #64748b; margin-top: 8px; font-size: 14px;">Two-Factor Authentication</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 12px; margin: 30px 0; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Your Admin OTP</p>
          <div style="color: white; font-size: 48px; font-weight: bold; letter-spacing: 16px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 600;">
            ⚠️ Security Notice
          </p>
          <p style="color: #78350f; margin: 8px 0 0 0; font-size: 13px; line-height: 1.5;">
            This is an admin login attempt. If you did not initiate this, please contact your security team immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            This code will expire in <strong style="color: #1e293b;">10 minutes</strong>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">
            Never share this code with anyone, including Bulky support staff.
          </p>
        </div>
      </div>
      
      <div style="margin-top: 30px; text-align: center; padding: 20px; background: white; border-radius: 12px;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          🔒 <strong>Admin Portal</strong> • Two-Factor Authentication
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">
          Bulky Email Campaign Manager - Admin Security System
        </p>
      </div>
    </div>
  `;
}



