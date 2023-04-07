import { Server } from "./server";
import { getOptions } from "./utils";

const options = getOptions("./config.json")
const server = new Server(options)
server.start()