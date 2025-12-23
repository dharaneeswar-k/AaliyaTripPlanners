const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    res.send("Server is running");
});

app.use(express.static(path.join(__dirname, "public"), { extensions: ['html'] }));

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/public", require("./src/routes/publicRoutes"));
app.use("/api/upload", require("./src/routes/uploadRoutes"));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to DB:", error);
        process.exit(1);
    }
};

startServer();
