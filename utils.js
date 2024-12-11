const { createCanvas, loadImage, registerFont } = require("canvas");
const cloudinary = require("./config/cloudinary");
const fs = require("fs");
const path = require("path");
const { sendCertificateEmail } = require("./mailers/mail");
const User = require("./model");
const { certificateQueue } = require("./queue");
const { newError } = require("./response");

// const filestack = require("filestack-node");
// const client = filestack.init("your-api-key"); // Replace with your Filestack API key

async function generateAndUploadCertificate(name, course) {
  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext("2d");

  // Load template
  const template = await loadImage("./templates/certificate_template.png");
  ctx.drawImage(template, 0, 0, 1200, 800);

  // Add text
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#000";
  ctx.fillText(name, 600, 400); // Adjust as per template
  ctx.fillText(course, 600, 500);

  // Convert to buffer and upload to Cloudinary
  const buffer = canvas.toBuffer("image/png");
  const result = await cloudinary.uploader
    .upload_stream({
      resource_type: "image",
      folder: "certificates",
      public_id: `${name}_certificate`,
    })
    .end(buffer);

  return result.secure_url;
}

const convertExcelToBase64 = async () => {
  // Read the Excel file as binary data
  const filePath = "./MOCK_DATA.xlsx"; // Path to your Excel file
  const fileBuffer = fs.readFileSync(filePath);

  // Convert binary data to a base64 string
  const base64String = fileBuffer.toString("base64");

  console.log(base64String);
  return base64String;
};


const generateCertificatesInBatches = async (users, batchSize = 10) => {
  registerFont(path.join(__dirname, "/AlexBrush-Regular.ttf"), {
    family: "Alex Brush",
  });

  registerFont("./static/Montserrat-VariableFont_wght.ttf", {
    family: "Montserrat",
  });

  registerFont("./static/MontserratAlternates-Regular.otf", {
    family: "MontserratAlternatesRegular",
  });

  registerFont(path.join(__dirname, "/static/Roboto-Regular.ttf"), {
    family: "Roboto",
  });
  registerFont(path.join(__dirname, "/static/Roboto-Bold.ttf"), {
    family: "Roboto",
    weight: "bold",
  });
  registerFont(path.join(__dirname, "/static/Roboto-Italic.ttf"), {
    family: "Roboto",
    style: "italic",
  });

  const templatePath = path.join(__dirname, "certificate_template.png");
  const outputDir = path.join(__dirname, "generated_certificates");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    const templateImage = await loadImage(templatePath);

    const totalUsers = users.length;
    let currentBatchStart = 0;

    while (currentBatchStart < totalUsers) {
      const batch = users.slice(
        currentBatchStart,
        currentBatchStart + batchSize
      );

      // Process the current batch
      await Promise.all(
        batch.map(async (user) => {
          const { name, role, email } = user;

          // Create a canvas and context
          const canvas = createCanvas(
            templateImage.width,
            templateImage.height
          );
          const context = canvas.getContext("2d");

          // Draw the certificate template
          context.drawImage(templateImage, 0, 0);
          context.font = 'bold 150px "Alex Brush"';
          context.fillStyle = "#8646E5";
          context.textAlign = "center";
          context.fillText(name, canvas.width / 2, 800);

          // Customize role display
          context.font = 'bold 30px "Roboto"';
          const roleY = 415;
          if (role.toLowerCase() === "participant") {
            context.fillText(role.toUpperCase(), 1237, roleY);
          } else if (role.toLowerCase() === "volunteer") {
            context.fillText(role.toUpperCase(), 1215, roleY);
          } else if (role.toLowerCase() === "speaker") {
            context.fillText(role.toUpperCase(), 1200, roleY);
          }

          // Save the certificate
          const outputPath = path.join(
            outputDir,
            `${name.replace(/ /g, "_")}_certificate.png`
          );
          const out = fs.createWriteStream(outputPath);
          const stream = canvas.createPNGStream();
          stream.pipe(out);

          await new Promise((resolve, reject) => {
            out.on("finish", resolve);
            out.on("error", reject);
          });

          const { url } = await uploadCertificateToCloudinary(outputPath);

          await insertUser({
            name,
            role: role.toLowerCase(),
            email,
            certificateUrl: url,
          });

          await sendCertificateEmail(user, outputPath, url);

          fs.unlink(outputPath, (err) => {
            if (err) console.error(`Failed to delete file: ${outputPath}`, err);
          });
        })
      );

      // Move to the next batch
      currentBatchStart += batchSize;

      console.log(
        `Processed batch: ${currentBatchStart} of ${totalUsers} users.`
      );
    }

    return {
      status: "success",
      message: "All certificates processed in batches.",
    };
  } catch (error) {
    console.error("Error processing certificates in batches:", error);
    throw new Error("Failed to process certificates in batches");
  }
};


// Function to upload the certificate file to Filestack
const uploadCertificateToFilestack = (filePath) => {
  return new Promise((resolve, reject) => {
    client
      .upload(filePath)
      .then((result) => {
        console.log("File uploaded successfully:", result);
        resolve(result.url); // Return the URL of the uploaded file
      })
      .catch((error) => {
        console.error("Error uploading file to Filestack:", error);
        reject(error);
      });
  });
};

const uploadCertificateToCloudinary = async (imagePath) => {
  try {
    const certificateImage = await cloudinary.uploader.upload(imagePath, {
      folder: "certificates", // Specify the folder in Cloudinary
      width: 300, // Resize width to 300
      crop: "scale", // Apply scaling crop
    });

    // Return the Cloudinary response
    const response = {
      public_id: certificateImage.public_id,
      url: certificateImage.secure_url,
    };

    return response;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// const bulkInsertUsers = async (users) => {

//   try {
//     const result = await User.insertMany(users, { ordered: true });
//     console.log("Bulk insert successful:", result);
//   } catch (error) {
//     console.error("Error during bulk insert:", error);
//   }
// };

const insertUser = async (user) => {
  try {
    const result = await User.create(user);
    console.log("insert successful:", result);
  } catch (error) {
    console.error("Error during bulk insert:", error);
  }
};

module.exports = {
  generateAndUploadCertificate,
  convertExcelToBase64,
  generateCertificatesInBatches,
  uploadCertificateToCloudinary,
  insertUser,
};
