import { ETH, Peer, RLPx } from "@ethereumjs/devp2p";

export class EthPeer {
    public eth: ETH
    public peer: Peer
    public isVerified = false
    public Timer: NodeJS.Timeout
    public id: string
    constructor(eth: ETH, peer: Peer) {
        this.eth = eth
        this.peer = peer
        this.id = (peer.getId() as Buffer).toString('hex')
    }
    disconnect(reason: any) {
        this.peer.disconnect(reason)
    }

}