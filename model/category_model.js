import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const Category = mongoose.model("Category", categorySchema);

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }
});

const SubCategory = mongoose.model("Sub Category", subCategorySchema);

export { Category, SubCategory };