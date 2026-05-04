const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send contact form email to admin
const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.ADMIN_CONTACT_EMAIL,
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #4F46E5; }
            .value { margin-top: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent from your exam platform contact form.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Contact email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send exam results email
const sendExamResultsEmail = async (studentEmail, studentName, examTitle, score, totalMarks) => {
  try {
    const transporter = createTransporter();
    const percentage = (score / totalMarks) * 100;
    
    const mailOptions = {
      from: `"Exam Platform" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Your Exam Results: ${examTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
            .details { background: #f3f4f6; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Exam Results</h2>
            </div>
            <div class="score">
              ${score}/${totalMarks} (${percentage.toFixed(1)}%)
            </div>
            <div class="details">
              <p>Dear ${studentName},</p>
              <p>You have completed the exam "<strong>${examTitle}</strong>".</p>
              <p>Your score: <strong>${score}/${totalMarks}</strong></p>
              <p>Percentage: <strong>${percentage.toFixed(1)}%</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Exam results email sent to:', studentEmail);
  } catch (error) {
    console.error('Email sending error:', error);
  }
};

module.exports = { sendContactEmail, sendExamResultsEmail };