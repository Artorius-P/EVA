import { Server } from "./server";
import { RLPx, DPT, Peer } from "@ethereumjs/devp2p";
import LRUCache from "lru-cache";
import { Logger } from "tslog";
import { ETH } from "./eth";

const getPeerAddr = (peer: Peer) =>
  `${peer._socket.remoteAddress}:${peer._socket.remotePort}`

export class Handler {
    public logger = new Logger
    public eth: ETH
    public rlpx: RLPx
    constructor(eth: ETH, rlpx: RLPx) {
      this.eth = eth
      this.rlpx = rlpx
    }

    async handle(peer: Peer) {
      await this.handshake(peer)
    }

    async handshake(peer: Peer) {
      const addr = getPeerAddr(peer)
      let j = 0
      const prot = peer.getProtocols()
      const eth = peer.getProtocols()[0]
      // TODO: sendstatus
    }
    
}

