import "dotenv/config";
// import config from "./config";
import { prisma } from "./app/lib/prisma";
import app from "./app";

// const PORT = config.port;

async function main() {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
       app.listen(8080, () => {
        console.log(`Server is running on port ${8080}`);
       }) 
    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
