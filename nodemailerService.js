import nodemailer from 'nodemailer';

// Set up Nodemailer to send the verification email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,  // Your email
        pass: process.env.PASS   // Your email password
    }
});

// Save the original sendMail method
const originalSendMail = transporter.sendMail.bind(transporter);

// Override the sendMail method
transporter.sendMail = function (to, subject, msgBody, isHTML) {
    const mailOptions = {
        from: process.env.USER,  // Explicitly define 'from' in each mailOptions
        to: to,
        subject: subject,
        [isHTML ? 'html' : 'text']: msgBody
    };
    
    // Call the original sendMail method
    return originalSendMail(mailOptions);
};

export default transporter;