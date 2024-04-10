import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./userModel";
import bcrypt from "bcrypt";
import Product from "./ProductModel";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";

dotenv.config();

const mongo_url: string = process.env.mongo_url || "";

const app: Application = express();
const port = process.env.PORT || 4500;
app.use(express.json());

mongoose
  .connect(mongo_url)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e) => {
    console.log("Cannot connect", e);
  });

app.get("/", (req: Request, res: Response) => {
  res.send("typescript server running");
});

app.listen(port, () => {});

// ADD A NEW USER BY SENDING EMAIL AND PASSWORD AS REQ BODY
// EMAIL SHOULD BE UNIQUE
// RETURNS UNIQUE ID OF USER WHICH IS NEEDED TO UPDATE PASSWORD
app.post("/register", (req: Request, res: Response) => {
  bcrypt.hash(req.body.password, 10).then((hashedPassword: String) => {
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    user.save().then(() => {
      res
        .status(201)
        .send({ message: "User created successfully", id: user._id });
      console.log("object created");
    });
  });
});

// LOGIN FUNCTION IMPLMENTED USING JSW
// GENERATES A TOKEN WHICH IS VALID FOR 24 HRS
// TOKEN CAN BE USED TO VALIDATE ENDPOINT
// TO IMPLEMENT LOGOUT, SIMPLY DELETE THE TOKEN FROM FRONTEND
app.post("/login", (req: Request, res: Response) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(400).json("No user found");
    }

    bcrypt.compare(req.body.password, user.password).then((passwordCheck) => {
      if (!passwordCheck) {
        return res.status(400).send({
          message: "Passwords does not match",
        });
      }
      const token = jwt.sign(
        {
          userId: user._id,
          userEmail: user.email,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );
      res.status(200).send({
        message: "Login Successful",
        email: user.email,
        token,
      });
    });
  });
});

interface AuthRequest extends Request {
  user?: any;
}

// FUNCTION TO TEST IF USER IS AUTHORIZED OR NOT BASED ON TOKEN GENERATED
const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new Error();
    }
    const decoded = jwt.verify(token, "RANDOM-TOKEN");
    const user = decoded;
    req.user = user;
    next();
  } catch (err) {
    res.status(401).send("Unauthorized");
  }
};

// TEST IF USER IS AUTHORIZED OR NOT BY PASSING TOKEN IN THE BEARER TOKEN IN AUTHORIZATION SECTION
app.get("/testuser", auth, (req: AuthRequest, res: Response) => {
  res.send(`You are authorized!`);
});

// CHANGE PASSWORD OF EXISTING USER BY PASSING ID AS QUERY
// SEND OLD AND NEW PASSWORD AS REQUEST BODY TO UPDATE PASSWORD
app.post("/user/:id", async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid: boolean = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hashedPassword: string = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --------------------------------------------------- PRODUCT SECTION------------------------------------------------------

// ADD A PRODUCT WITH DIFFERENT REQUIRED FIELDS
// RETURNS ID OF PRODUCT ADDED
app.post("/addproduct", (req: Request, res: Response) => {
  const product = new Product({
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
  });
  product.save().then(() => {
    res.status(201).send({ message: "Product added", id: product._id });
  });
});

// GET ALL THE REQUIRED PRODUCTS
// RETURNS A JSON OF ALL PRODUCT OBJECTS
app.get("/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
