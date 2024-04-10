import mongoose from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: [true, "Email Exist"],
  },
  password: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: false,
  },
});

const User = mongoose.model<UserDocument>("User", UserSchema);

export default User;
