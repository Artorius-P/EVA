import { Server } from "./server";
import { RLPx, DPT, Peer } from "@ethereumjs/devp2p";
import LRUCache from "lru-cache";
import { Logger } from "tslog";

const getPeerAddr = (peer: Peer) =>
  `${peer._socket.remoteAddress}:${peer._socket.remotePort}`;

export class Handler {
    public logger = new Logger
    private txCache = new LRUCache({max: 1000})
    private blockCache = new LRUCache({max: 100})

    // Nodes should send status first
    status(status: any) {
        this.logger.debug(`besthash: ${status.bestHash.toString('hex')} forkid: ${status.forkId.toString('hex')}`)

    }
    newTxHash() {

    }

    newTx() {

    }

    newBlockHash() {

    }

    getBlockHeaders() {

    }

    blockHeaders() {

    }

    getBlockBodies(){

    }

    newBlock() {

    }

}

