const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ApplicationSchema = new mongoose.Schema(
  {},
  { 
    strict: false,
    timestamps: true
  }
);

module.exports = mongoose.model('Application', ApplicationSchema); 