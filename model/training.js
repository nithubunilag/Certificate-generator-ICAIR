const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  course: {
    type: String,
    required: true,
    enum: ["frontend", "backend", "product design", 'mobile', 'data analytics', 'fullstack'],
  },
  program: {
    type: String,
    required: true,
    enum: ["NITDEV", "NITDATA", "HATCHDEV"],
  },
  certificateUrl: { type: String, required: false, default: "" },
});

const Training = mongoose.model("Training", trainingSchema);

module.exports = Training;
