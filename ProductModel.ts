import mongoose from "mongoose";

export interface ProductModel extends mongoose.Document {
  name: string;
  category: string;
  price:string;
}
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "enter name!"],
    unique: [true, "Email Exist"],
  },
  category: {
    type: String,
    required: [true, "entr category!"],
    unique: false,
  },
  price: {
    type: Number,
    required: [true, "enter price!"],
    unique: false,
  },
});

const Product = mongoose.model<ProductModel>("Product", productSchema);

export default Product;
