const transporter = require("../config/transporter");
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendCertificateEmail = async (user, filePath, certificateUrl) => {
  const { name, email, role } = user;

  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Thank You and Certificate of Participation for MIRG-ICAIR 2024",
    template: "certificate",
    context: {
      name,
      role:
        role,
      event: "MIRG-ICAIR 2024",
      theme:
        "Artificial Intelligence For Future Industrialization of Medicine in Sub-Saharan Africa",
      certificateUrl,
    },
    attachments: [
      {
        filename: `${name}_certificate.png`,
        path: filePath, // Local file path of the certificate
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


const sendTrainingCertificateEmail = async (user, filePath, certificateUrl) => {
  const { name, email, course, program } = user;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Congratulations on Completing Your Training Program!",
    template: "trainingCertificate",
    context: {
      name,
      programName: course == 'frontend' || course == 'backend' || course == 'mobile' || course == 'fullstack'? course.toUpperCase() + ' ' +"DEVELOPMENT" : course.toUpperCase(),
      program,
      certificateUrl,
      senderName: "Kingsley Ogbonna Victor",
      senderPosition: "Training Manager"
    },
    attachments: [
      {
        filename: `${name}_certificate.png`,
        path: filePath, // Local file path of the certificate
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendCertificateEmailBySendGrid = async (user, certificateUrl) => {
  const { name, email, role } = user;

  const message = {
    to: email,
    from: process.env.SENDGRID_SENDER_EMAIL, // Verified sender email
    templateId: "your-template-id", // Template ID from SendGrid dashboard
    dynamicTemplateData: {
      name: name,
      role:
        role === "volunteer"
          ? "Volunteering"
          : role === "participant"
          ? "Participating"
          : "Speaking",
      event: "MIRG-ICAIR 2024",
      theme:
        "Artificial Intelligence For Future Industrialization of Medicine in Sub-Saharan Africa",
      certificateUrl,
    },
  };

  try {
    const response = await sgMail.send(message);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error.response?.body || error);
  }
};

module.exports = { sendCertificateEmail, sendCertificateEmailBySendGrid , sendTrainingCertificateEmail};
