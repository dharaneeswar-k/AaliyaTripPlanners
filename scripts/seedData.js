const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Package = require('./src/models/Package');
const Transport = require('./src/models/Transport');
const Review = require('./src/models/Review');
const OwnerProfile = require('./src/models/OwnerProfile');
const fs = require('fs');

dotenv.config();

const packages = [
    {
        title: "Romantic Ooty Honeymoon",
        packageType: "COUPLE",
        destination: "Ooty",
        duration: "3 Days / 2 Nights",
        startingPrice: 12500,
        minPeople: 2,
        description: "Experience the queen of hills with your loved one. Includes candle light dinner and flower decoration.",
        itinerary: "Day 1: Arrival & Check-in, Botanical Garden.\nDay 2: Pykara Lake & Shooting Spot.\nDay 3: Tea Museum & Departure.",
        inclusions: "Accommodation in 3 Star Hotel\nBreakfast & Dinner\nPrivate Cab for Sightseeing\nHoneymoon Cake",
        exclusions: "Lunch\nEntry Fees\nPersonal Expenses",
        images: ["/images/ooty.jpg"],
        offerText: "Early Bird",
        offerPercent: 10
    },
    {
        title: "Kodaikanal Family Escape",
        packageType: "COMMON",
        destination: "Kodaikanal",
        duration: "3 Days / 2 Nights",
        startingPrice: 15000,
        minPeople: 4,
        description: "Perfect family gateway to the princess of hills.",
        itinerary: "Day 1: Lake Boating & Bryant Park.\nDay 2: Pillar Rocks & Guna Caves.\nDay 3: Coaker's Walk & Shopping.",
        inclusions: "Family Suite Stay\nBreakfast\nSightseeing by Innova",
        exclusions: "Lunch & Dinner\nBoating Charges",
        images: ["/images/sheep.jpg"],
        offerText: "Family Deal",
        offerPercent: 5
    },
    {
        title: "Misty Munnar Retreat",
        packageType: "COMMON",
        destination: "Munnar",
        duration: "4 Days / 3 Nights",
        startingPrice: 18999,
        minPeople: 2,
        description: "Explore the tea gardens and waterfalls of Kerala.",
        itinerary: "Day 1: Cheeyappara Waterfalls.\nDay 2: Eravikulam National Park.\nDay 3: Mattupetty Dam.\nDay 4: Tea Museum.",
        inclusions: "Resort Stay\nAll Meals\nJeep Safari",
        exclusions: "Travel to Munnar",
        images: ["/images/elephant.jpg"]
    },
    {
        title: "Valparai Nature Trek",
        packageType: "COUPLE",
        destination: "Valparai",
        duration: "2 Days / 1 Night",
        startingPrice: 8500,
        minPeople: 2,
        description: "Offbeat location for nature lovers.",
        itinerary: "Day 1: Aliyar Dam & Monkey Falls.\nDay 2: Sholayar Dam & Viewpoints.",
        inclusions: "Cottage Stay\ncampfire\nGuide",
        exclusions: "Food",
        images: ["/images/valparai.jpg"]
    }
];

const transports = [
    {
        name: "Toyota Etios",
        capacity: 4,
        pricePerKm: 13,
        image: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Toyota_Etios_1.5_XLS_Sedan_2013_%2814630732891%29.jpg"
    },
    {
        name: "Toyota Innova Crysta",
        capacity: 7,
        pricePerKm: 22,
        image: "https://upload.wikimedia.org/wikipedia/commons/6/62/Toyota_Innova_Crysta_2.4_ZX_2016.jpg"
    },
    {
        name: "Tempo Traveller",
        capacity: 12,
        pricePerKm: 28,
        image: "https://5.imimg.com/data5/SELLER/Default/2021/4/MI/VM/VO/8724103/tempo-traveller-rental-service-500x500.jpg"
    }
];

const reviews = [
    {
        customerName: "Suresh Kumar",
        rating: 5,
        comment: "Excellent service by Aaliya Trip Planners. The driver was very professional and the hotel in Ooty was top notch.",
        customerPhoto: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        customerName: "Priya & Raj",
        rating: 5,
        comment: "We had a wonderful honeymoon in Kodaikanal. Thanks for the candle light dinner surprise!",
        customerPhoto: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
        customerName: "Anita Desai",
        rating: 4,
        comment: "Good trip, value for money. The van was clean and on time.",
        customerPhoto: "https://randomuser.me/api/portraits/women/68.jpg"
    }
];

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('seed_progress.txt', msg + '\n');
};

const seedData = async () => {
    fs.writeFileSync('seed_progress.txt', 'Script started...\n');
    try {
        log(`Connecting to DB...`);
        await connectDB();
        log("DB Connected. Clearing old data...");

        await Package.deleteMany({});
        await Transport.deleteMany({});
        await Review.deleteMany({});
        await OwnerProfile.deleteMany({});

        log("Seeding Packages...");
        await Package.insertMany(packages);

        log("Seeding Transports...");
        await Transport.insertMany(transports);

        log("Seeding Reviews...");
        await Review.insertMany(reviews);

        log("Seeding Owner Profile...");
        await OwnerProfile.create({
            name: "Unknown",
            photo: "/images/logo.png",
            phone: "+91 85266 30786",
            instagram: "https://www.instagram.com/aaliya_trip_planners",
            description: "Travel Consultant / Founder of Aaliya Trip Planners"
        });

        const pkgCount = await Package.countDocuments();
        log(`Verification: Packages in DB: ${pkgCount}`);

        log("Data Seeded Successfully!");
        process.exit();
    } catch (error) {
        log("Seeding Failed: " + error.message);
        console.error(error);
        process.exit(1);
    }
};

seedData();
