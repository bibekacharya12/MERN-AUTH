import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const connectionString = await mongoose.connect(
      `${process.env.MONGODB_URI}/mern-auth`
    );
    console.log("Database connected", connectionString.connection.host);
  } catch (error) {
    console.log("Error while connecting database", error.message);
  }
};

export default connectToDB;
