const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
// Middleware
app.use(
  cors({
    origin: "https://next-assignment8-frontend.vercel.app",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment-8-l2");
    const flashSaleCollection = db.collection("flash-sale");
    const productsCollection = db.collection("products");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { name: user.name, email: user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );
      res.cookie("token", token, {
        secure: process.env.NODE_ENV === "development",
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================

    app.post("/api/v1/flash-sale", async (req, res) => {
      try {
        const body = req.body;
        const result = await flashSaleCollection.insertOne(body);
        res.send(result);
      } catch (error) {
        console.error("Error in personalInfo route:", error);
        res.status(500).json({ error: "An error occurred flash sale" });
      }
    });
    app.post("/api/v1/products", async (req, res) => {
      try {
        const body = req.body;
        const result = await productsCollection.insertOne(body);
        res.send(result);
      } catch (error) {
        console.error("Error in productsCollection route:", error);
        res.status(500).json({ error: "An error occurred productsCollection" });
      }
    });

    app.get("/api/v1/flash-sale", async (req, res) => {
      const result = await flashSaleCollection
        .find()
        .sort({ createdAt: 1 })
        .toArray();
      res.send(result);
    });
    // app.get("/api/v1/products", async (req, res) => {
    //   const result = await flashSaleCollection
    //     .find()
    //     .sort({ createdAt: 1 })
    //     .toArray();
    //   res.send(result);
    // });
    app.get("/api/v1/products", async (req, res) => {
      try {
        let filter = {};

        if (Object.keys(req.query).length > 0) {
          if (req.query.rating) {
            const ratingRange = req.query.rating.split("-");
            if (ratingRange.length === 2) {
              filter.rating = {
                $gte: parseInt(ratingRange[0]),
                $lte: parseInt(ratingRange[1]),
              };
            } else {
              filter.rating = parseInt(req.query.rating);
            }
          }
          if (req.query.price) {
            const priceRange = req.query.price.split("-");
            if (priceRange.length === 2) {
              filter.price = {
                $gte: parseInt(priceRange[0]),
                $lte: parseInt(priceRange[1]),
              };
            } else {
              filter.price = parseInt(req.query.price);
            }
          }
          if (req.query.category) {
            filter.category = req.query.category;
          }

          const result = await flashSaleCollection
            .find(filter)
            .sort({ createdAt: 1 })
            .toArray();

          res.send(result);
        } else {
          const result = await flashSaleCollection
            .find()
            .sort({ createdAt: 1 })
            .toArray();

          res.send(result);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/api/v1/products/:id", async (req, res) => {
      const id = req.params.id;
      const result = await flashSaleCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/api/v1/flash-saleData", async (req, res) => {
      const result = await flashSaleCollection
        .find({ flashSale: true })
        .sort({ createdAt: 1 })
        .toArray();
      res.send(result);
    });
    app.get("/api/v1/trending-product", async (req, res) => {
      const result = await flashSaleCollection
        .find()
        .sort({ rating: -1 })
        .toArray();
      res.send(result);
    });
    app.get("/api/v1/flash-sale/:text", async (req, res) => {
      try {
        if (req.params.text) {
          const result = await flashSaleCollection
            .find({ category: req.params.text })
            .toArray();
          return res.send(result);
        } else {
          const result = await flashSaleCollection.find().toArray();
          res.send(result);
        }
      } catch (error) {
        console.error("Error fetching flash sale data:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    app.get("/api/v1/flash-sales", async (req, res) => {
      try {
        if (req.query.category) {
          const result = await flashSaleCollection
            .find({
              category: req.query.category,
            })
            .toArray();
          return res.send(result);
        }
      } catch (error) {
        console.error("Error fetching flash sale data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/api/v1/flash-sale/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await flashSaleCollection.findOne(query);
      res.send(result);
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
