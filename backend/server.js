import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectToDB from "./Config/dbConnection.config.js";
import authRouter from "./Routes/auth.route.js";
import userRouter from "./Routes/user.route.js";

// connecting to database
await connectToDB();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ["http://localhost:5173"];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // Allow all origins
    },
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("<h1>API WORKING</h1>");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running at port : ${PORT}`);
});
