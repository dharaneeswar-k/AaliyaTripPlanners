const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Package = require('./src/models/Package');
const Transport = require('./src/models/Transport');
const Review = require('./src/models/Review');

dotenv.config();

const audit = async () => {
    try {
        fs.writeFileSync('audit_output.txt', "Starting Audit...\n");
        await mongoose.connect(process.env.MONGO_URI);

        const totalPkg = await Package.countDocuments();
        const activePkg = await Package.countDocuments({ isActive: true });

        fs.appendFileSync('audit_output.txt', `Total Packages: ${totalPkg}\n`);
        fs.appendFileSync('audit_output.txt', `Active Packages: ${activePkg}\n`);

        if (totalPkg > 0) {
            const sample = await Package.findOne();
            fs.appendFileSync('audit_output.txt', `First Package: ${JSON.stringify(sample, null, 2)}\n`);
        }

        const totalReviews = await Review.countDocuments();
        fs.appendFileSync('audit_output.txt', `Total Reviews: ${totalReviews}\n`);

        process.exit(0);
    } catch (e) {
        fs.appendFileSync('audit_output.txt', `Error: ${e.message}\n`);
        process.exit(1);
    }
};
audit();
