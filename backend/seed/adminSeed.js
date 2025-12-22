import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/user.model.js";
import connectToDb from "../config/db.config.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  await connectToDb();

  try {
    const adminEmail = "admin@lms.com";
    const adminPassword = "admin123";

    console.log(`Attempting to seed admin user with email: ${adminEmail}`);

    let adminUser = await userModel.findOne({ email: adminEmail });

    if (adminUser) {
      console.log("Existing admin user found by email. Deleting...");
      await userModel.deleteOne({ email: adminEmail });
      console.log("Existing admin user deleted by email.");
    }

    adminUser = await userModel.findOne({ username: "admin" });
    if (adminUser) {
      console.log("Existing admin user found by username. Deleting...");
      await userModel.deleteOne({ username: "admin" });
      console.log("Existing admin user deleted by username.");
    }

    console.log("Creating new admin user...");
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await userModel.create({
      fullName: "Admin User",
      username: "admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      avatar: {
        public_id: "admin_avatar",
        secure_url: "https://res.cloudinary.com/dhwbyshmo/image/upload/v1695283699/project%20images/lms-home.png",
      },
    });
    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

seedAdmin();
