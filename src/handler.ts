import { Peer } from "@ethereumjs/devp2p";
import { Logger } from "tslog";
import { EthHandler } from "./eth";
import { Consts } from "./interfaces";

const getPeerAddr = (peer: Peer) =>
  `${peer._socket.remoteAddress}:${peer._socket.remotePort}`
const getPeerId = (peer: Peer) => (peer.getId() as Buffer).toString('hex')

export class Handler {
  public logger = new Logger({ minLevel: 2 })
  public eth: EthHandler
  constructor(eth: EthHandler) {
    this.eth = eth
  }

  async handleAdd(peer: Peer) {
    this.logger.debug(`Handle peer added: ${getPeerId(peer)}`)
    await this.eth.handle(peer)
    // TODO: LES Protocol
  }


  async handleRemove(peer: Peer, reason: any) {
    this.logger.debug(`Handle peer removed: ${getPeerId(peer)}, Reason: ${reason}`)
  }

  setConsts(consts: Consts) {
    this.eth.setConsts(consts)
  }

}

