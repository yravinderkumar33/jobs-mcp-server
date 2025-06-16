const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    timestamps: true
  }
);

module.exports = mongoose.model('Job', JobSchema); 