import express, { type Application, type Request,type Response } from "express"

import { toNodeHandler } from "better-auth/node";
import cors from "cors"
import cookieParser from "cookie-parser"
import { IndexRoutes } from "./app/routes"
import path from "path"
import qs from "qs"
import { globalErrorHandler } from "./app/middleware/globalErrorHandler"
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
const app:Application = express()


app.use(cors({
    origin: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL, "http://localhost:3000", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use("/api/auth", toNodeHandler(auth))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.set("query parser", (str : string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views",path.resolve(process.cwd(), `src/app/templates`)) 


app.use("/api/v1",IndexRoutes)


app.get('/', async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Content Forge API is running',
    })
});

app.use(globalErrorHandler)

export default app
