import { ETH, Peer, RLPx } from "@ethereumjs/devp2p";

export class EthPeer {
    public eth: ETH
    public peer: Peer
    public isVerified = false
    public Timer: NodeJS.Timeout
    constructor(eth: ETH, peer: Peer) {
        this.eth = eth
        this.peer = peer
    }

}