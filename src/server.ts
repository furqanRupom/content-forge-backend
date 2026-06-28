import "dotenv/config";
import { prisma } from "./app/lib/prisma";
import app from "./app";
import { seedManager, seedTemplates } from "./app/utils/seed";
import { envVars } from "./app/config/env";

// const PORT = config.port;

async function main() {
    try {
        await prisma.$connect();
        // await seedManager()
        // await seedTemplates()
        console.log("Connected to the database successfully.");
       app.listen(envVars.PORT, () => {
        console.log(`Server is running on port ${envVars.PORT}`);
       }) 
    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
