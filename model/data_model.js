// Define Mongoose Schema
import { Schema, model } from 'mongoose';

const dataSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true }
});

// Create a model based on the schema
const Data = model('Data', dataSchema);

export default Data;
