const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Package = require('./src/models/Package');
const Transport = require('./src/models/Transport');
const Review = require('./src/models/Review');
const OwnerProfile = require('./src/models/OwnerProfile');

dotenv.config();

const checkDB = async () => {
    try {
        fs.writeFileSync('db_check_output.txt', "Connecting to DB...\n");
        await mongoose.connect(process.env.MONGO_URI);
        fs.appendFileSync('db_check_output.txt', "Connected.\n");

        const pkgCount = await Package.countDocuments();
        const transportCount = await Transport.countDocuments();
        const reviewCount = await Review.countDocuments();
        const profileCount = await OwnerProfile.countDocuments();

        const output = `Packages: ${pkgCount}\nTransports: ${transportCount}\nReviews: ${reviewCount}\nOwnerProfiles: ${profileCount}\n`;
        fs.appendFileSync('db_check_output.txt', output);

        process.exit(0);
    } catch (error) {
        fs.appendFileSync('db_check_output.txt', "Error: " + error.message + "\n");
        process.exit(1);
    }
};

checkDB();
