import { EthHandler } from "./eth";
import { Handler } from "./handler";
import { Server } from "./server";
import { getOptions } from "./utils";

const options = getOptions("./config.json")
const eth = new EthHandler()
const handler = new Handler(eth)
const server = new Server(options, handler)
console.log("Starting Server...")
server.start()