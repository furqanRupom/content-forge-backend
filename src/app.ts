import express, { type Application, type Request,type Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { IndexRoutes } from "./app/routes"
import { globalErrorHandler } from "./app/middleware/globalErrorHandler"
const app:Application = express()


app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1",IndexRoutes)


app.get('/', async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Content Forge API is running',
    })
});

app.use(globalErrorHandler)

export default app
