import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
});

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rounds: [roundSchema],
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  roles: [roleSchema],
});

const Company = mongoose.model("Company", companySchema);
export default Company;
