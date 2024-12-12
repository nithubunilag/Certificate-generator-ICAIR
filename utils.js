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

// Function to upload the certificate file to Filestack

// const generateCertificates = async (users) => {
//   registerFont(path.join(__dirname, "/AlexBrush-Regular.ttf"), {
//     family: "Alex Brush",
//   });

//   registerFont(path.join(__dirname, "/static/PlaywriteGBSGuides-Italic.ttf"), {
//     family: "Playwrite GB S Guides",
//   });

//   registerFont("./static/Montserrat-VariableFont_wght.ttf", {
//     family: "Montserrat",
//   });

//   registerFont("./static/MontserratAlternates-Regular.otf", {
//     family: "MontserratAlternatesRegular",
//   });

//   // Register Roboto font files
//   registerFont(path.join(__dirname, "/static/Roboto-Regular.ttf"), {
//     family: "Roboto",
//   });
//   registerFont(path.join(__dirname, "/static/Roboto-Bold.ttf"), {
//     family: "Roboto",
//     weight: "bold",
//   });
//   registerFont(path.join(__dirname, "/static/Roboto-Italic.ttf"), {
//     family: "Roboto",
//     style: "italic",
//   });

//   const templatePath = path.join(__dirname, "certificate_template.png"); // Path to the certificate template
//   const outputDir = path.join(__dirname, "generated_certificates");

//   // Ensure the output directory exists
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir);
//   }

//   try {
//     const templateImage = await loadImage(templatePath);

//     for (const user of users) {
//       const { name, role, email } = user;

//       // Create a canvas with the same dimensions as the template
//       const canvas = createCanvas(templateImage.width, templateImage.height);
//       const context = canvas.getContext("2d");

//       // Draw the template onto the canvas
//       context.drawImage(templateImage, 0, 0);

//       // Customize text styles
//       context.font = 'normal 70px "Roboto"';
//       context.fillStyle = "#8646E5";
//       context.textAlign = "center";

//       // Add user details to the certificate
//       context.fillText(name, canvas.width / 2, 670); // Name (adjust Y position as needed)

//       if (role.toLowerCase() == "participant") {
//         const padding = 50; // Padding around text
//         const boxX = 949;
//         const boxY = 308;
//         const boxWidth = context.measureText(role).width + padding * 2; // Include padding width
//         const boxHeight = 150 + padding * 2; // Height of the box including padding
//         context.font = 'bold 30px "Roboto"';
//         context.fillStyle = "#8646E5";
//         // context.textAlign = "";
//         // context.fillText(role.toUpperCase(), 1237, 538); // Role

//         context.fillText(
//           role.toUpperCase(),
//           boxX + padding,
//           boxY + boxHeight / 2
//         ); // Role
//       } else if (role.toLowerCase() == "volunteer") {
//         const padding = 50; // Padding around text
//         const boxX = 940;
//         const boxY = 308;
//         const boxWidth = context.measureText(role).width + padding * 2; // Include padding width
//         const boxHeight = 150 + padding * 2; // Height of the box including padding
//         context.font = 'bold 30px "Roboto"';
//         context.fillStyle = "#8646E5";
//         // context.textAlign = "";
//         // context.fillText(role.toUpperCase(), 1237, 538); // Role

//         context.fillText(
//           role.toUpperCase(),
//           boxX + padding,
//           boxY + boxHeight / 2
//         ); // Role
//       } else if (role.toLowerCase() == "speaker") {
//         const padding = 50; // Padding around text
//         const boxX = 923.5;
//         const boxY = 308;
//         const boxWidth = context.measureText(role).width + padding * 2; // Include padding width
//         const boxHeight = 150 + padding * 2; // Height of the box including padding
//         context.font = 'bold 30px "Roboto"';
//         context.fillStyle = "#8646E5";
//         // context.textAlign = "";
//         // context.fillText(role.toUpperCase(), 1237, 538); // Role

//         context.fillText(
//           role.toUpperCase(),
//           boxX + padding,
//           boxY + boxHeight / 2
//         ); // Role
//       }

//       // Save the generated certificate
//       const outputPath = path.join(
//         outputDir,
//         `${name.replace(/ /g, "_")}_certificate.png`
//       );
//       const out = fs.createWriteStream(outputPath);
//       const stream = canvas.createPNGStream();
//       stream.pipe(out);

//       // Wait for the stream to finish
//       await new Promise((resolve, reject) => {
//         out.on("finish", resolve);
//         out.on("error", reject);
//       });

//       console.log(`Certificate generated for ${name}: ${outputPath}`);
//       const { url, public_id } = await uploadCertificateToCloudinary(
//         outputPath
//       );
//       const certificateUrl = url;
//       console.log(`Uploaded to Cloudinary: ${certificateUrl}`);

//       await insertUser({
//         name,
//         role: role.toLowerCase(),
//         email,
//         certificateUrl,
//       });

//       await sendCertificateEmail(user, outputPath, certificateUrl);

//       // Remove the file from the file system

//       fs.unlink(outputPath, (err) => {
//         if (err) {
//           console.error(`Failed to delete file: ${outputPath}`, err);
//         } else {
//           console.log(`Deleted file: ${outputPath}`);
//         }
//       });
//     }

//     return {
//       status: "success",
//       message: "Certificates generated successfully.",
//     };
//   } catch (error) {
//     console.error("Error generating certificates:", error);
//     throw new Error("Failed to generate certificates");
//   }
// };

const generateCertificates = async (users, batchSize = 10) => {
  registerFont(path.join(__dirname, "/AlexBrush-Regular.ttf"), {
    family: "Alex Brush",
  });

  registerFont(path.join(__dirname, "/static/PlaywriteGBSGuides-Italic.ttf"), {
    family: "Playwrite GB S Guides",
  });

  registerFont("./static/Montserrat-VariableFont_wght.ttf", {
    family: "Montserrat",
  });

  registerFont("./static/MontserratAlternates-Regular.otf", {
    family: "MontserratAlternatesRegular",
  });

  // Register Roboto font files
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

  const templatePath = path.join(__dirname, "certificate_template.png"); // Path to the certificate template
  const outputDir = path.join(__dirname, "generated_certificates");

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    const templateImage = await loadImage(templatePath);

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      // Process the batch in parallel
      await Promise.all(
        batch.map(async (user) => {
          const { name, role, email } = user;
          //  Check to to see if the user has gotten an email
          // Create a canvas with the same dimensions as the template
          const canvas = createCanvas(
            templateImage.width,
            templateImage.height
          );
          const context = canvas.getContext("2d");

          // Draw the template onto the canvas
          context.drawImage(templateImage, 0, 0);

          // Customize text styles
          context.font = 'normal 70px "Roboto"';
          context.fillStyle = "#8646E5";
          context.textAlign = "center";

          // Add user details to the certificate
          context.fillText(name, canvas.width / 2, 670); // Name

          // Handle role-specific placement
          const roleLowered = role.toLowerCase();
          const rolePositioning = {
            participant: { x: 953, y: 383 },
            volunteer: { x: 940, y: 383 },
            speaker: { x: 922, y: 383 },
          };

          if (rolePositioning[roleLowered]) {
            const { x, y } = rolePositioning[roleLowered];
            const padding = 50;
            context.font = 'bold 30px "Roboto"';
            context.fillStyle = "#8646E5";
            context.fillText(role.toUpperCase(), x + padding, y + padding);
          }

          // Save the generated certificate
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

          console.log(`Certificate generated for ${name}: ${outputPath}`);
          const { url } = await uploadCertificateToCloudinary(outputPath);

          await sendCertificateEmail(user, outputPath, url);

          await insertUser({
            name,
            role: roleLowered,
            email,
            certificateUrl: url,
          });
          // Remove the file from the file system
          fs.unlink(outputPath, (err) => {
            if (err) {
              console.error(`Failed to delete file: ${outputPath}`, err);
            } else {
              console.log(`Deleted file: ${outputPath}`);
            }
          });
        })
      );

      console.log(`Batch ${Math.floor(i / batchSize) + 1} processed.`);
    }

    return {
      status: "success",
      message: "Certificates generated successfully in batches.",
    };
  } catch (error) {
    console.error("Error generating certificates: ", error.message);
    throw new Error("Failed to generate certificates " + error.message);
  }
};

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
  if (!imagePath) {
    console.error("Invalid image path provided for upload.");
    return {
      success: false,
      message: "Image path is required and must be valid.",
    };
  }

  try {
    const certificateImage = await cloudinary.uploader.upload(imagePath, {
      folder: "certificates", // Specify the folder in Cloudinary
      width: 300, // Resize width to 300
      crop: "scale", // Apply scaling crop
    });

    const response = {
      public_id: certificateImage.public_id,
      url: certificateImage.secure_url,
    };

    console.log("Image uploaded successfully:", response);
    return {
      success: true,
      message: "Image uploaded successfully.",
      data: response,
    };
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);

    // Differentiating errors
    if (error.http_code === 400) {
      console.error("Bad request error. Check the provided parameters.");
    } else if (error.http_code === 401) {
      console.error("Authentication error. Verify Cloudinary credentials.");
    } else if (error.name === "TypeError") {
      console.error("Type error. Ensure imagePath is valid.");
    } else {
      console.error("Unexpected error during image upload.");
    }

    return {
      success: false,
      message: "Failed to upload image.",
      error,
    };
  }
};

const insertUser = async (user) => {
  // Input validation
  if (!user || !user.name || !user.email || !user.role) {
    console.error("Invalid user data. Required fields are missing.");
    return {
      success: false,
      message:
        "Invalid user data. Ensure 'name', 'email', and 'role' are provided.",
    };
  }

  try {
    const result = await User.create(user);
    console.log("User inserted successfully:", result);
    return {
      success: true,
      message: "User inserted successfully.",
      result,
    };
  } catch (error) {
    console.error("Error during user insert operation:", error);

    // Differentiating error types
    if (error.name === "ValidationError") {
      console.error("Validation Error:", error.message);
    } else if (error.name === "MongoNetworkError") {
      console.error("Database connection issue:", error.message);
    } else {
      console.error("Unexpected error during user insertion.");
    }

    // Return error details for further handling
    return {
      success: false,
      message: "Failed to insert user.",
      error,
    };
  }
};

const findUser = async (user) => {
  try {
    const userInfo = await User.findOne(user);
    return userInfo;
  } catch (error) {
    throw Error("There was an error ", error.message);
  }
};

module.exports = {
  generateAndUploadCertificate,
  convertExcelToBase64,
  generateCertificates,
  uploadCertificateToCloudinary,
  insertUser,
  findUser,
};
