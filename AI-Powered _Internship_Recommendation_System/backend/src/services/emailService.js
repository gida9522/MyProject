/**
 * Email Service
 * Handles all email notifications using Nodemailer
 */
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@internship-platform.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const emailService = {
    /**
     * Send email wrapper with error handling
     * @param {Object} options - Nodemailer options
     */
    sendEmail: async (options) => {
        try {
            await transporter.sendMail({
                from: `"Internship Platform" <${FROM_EMAIL}>`,
                ...options,
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            // In production, you might want to queue this or use a service like SendGrid
        }
    },

    /**
     * Send student activation email
     * @param {string} to
     * @param {string} firstName
     * @param {string} activationToken
     */
    sendStudentActivationEmail: async (to, firstName, activationToken) => {
        const activationUrl = `${CLIENT_URL}/activate?token=${activationToken}`;

        await emailService.sendEmail({
            to,
            subject: 'Activate Your Internship Account',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Welcome to the National Internship Platform</h2>
          <p>Hi ${firstName},</p>
          <p>Your university has registered you on the internship management platform. To activate your account, please click the link below:</p>
          <a href="${activationUrl}" style="display: inline-block; background-color: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Activate Account</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="background: #f4f4f4; padding: 10px; word-break: break-all;">${activationUrl}</p>
          <p>This link will expire in 7 days.</p>
          <p>After activation, you will be able to set your password and access the platform.</p>
        </div>
      `,
        });
    },

    /**
     * Send organization registration confirmation
     * @param {string} to
     * @param {string} orgName
     */
    sendOrganizationRegistrationEmail: async (to, orgName) => {
        await emailService.sendEmail({
            to,
            subject: 'Organization Registration Received',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Registration Received</h2>
          <p>Thank you for registering <strong>${orgName}</strong> on the National Internship Platform.</p>
          <p>Your registration is currently <strong>pending approval</strong> from the relevant university authorities.</p>
          <p>You will receive an email once your account has been approved.</p>
        </div>
      `,
        });
    },

    /**
     * Send organization approval email
     * @param {string} to
     * @param {string} orgName
     * @param {boolean} approved
     * @param {string} reason
     */
    sendOrganizationStatusEmail: async (to, orgName, approved, reason = '') => {
        const status = approved ? 'approved' : 'rejected';
        const subject = approved
            ? 'Organization Registration Approved'
            : 'Organization Registration Update';

        let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Registration ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Your organization <strong>${orgName}</strong> has been <strong>${status}</strong>.</p>
    `;

        if (approved) {
            html += `<p>You can now log in to the platform and start posting internship opportunities.</p>`;
            html += `<a href="${CLIENT_URL}/login" style="display: inline-block; background-color: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login</a>`;
        } else {
            html += `<p><strong>Reason:</strong> ${reason}</p>`;
            html += `<p>If you have any questions, please contact the university administration.</p>`;
        }

        html += `</div>`;

        await emailService.sendEmail({
            to,
            subject,
            html,
        });
    },

    /**
     * Send university welcome email with credentials
     * @param {string} to
     * @param {string} universityName
     * @param {string} password
     */
    sendUniversityWelcomeEmail: async (to, universityName, password) => {
        await emailService.sendEmail({
            to,
            subject: 'Welcome to the National Internship Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Welcome, ${universityName}!</h2>
          <p>Your university has been registered on the National Internship Platform and approved.</p>
          <p>You can now log in with the following credentials:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #e53e3e;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
          <a href="${CLIENT_URL}/login" style="display: inline-block; background-color: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login to Dashboard</a>
        </div>
      `,
        });
    },
};

module.exports = emailService;

