import { databases } from "./database"
import { storage } from "./storage"
import { logging } from "./logging"
import { appConfig } from "./app"

export const config = {
    databases,
    storage,
    logging,
    app: appConfig
}