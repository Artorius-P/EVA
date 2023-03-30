import { Consts } from "./interfaces/consts"
import { DPT, RLPx, ETH} from '@ethereumjs/devp2p'
import { ServerOptions } from "./interfaces/serverOptions"

export class Server {
    public consts: Consts
    public dpt: DPT | null = null
    public rlpx: RLPx | null = null
    public ip: string
    public refreshInterval: number
    public maxPeers: number
    public clientFilter: Array<string>
    private key: Buffer

    constructor(options: ServerOptions) {
        this.ip = options.ip ?? '0.0.0.0'
        this.consts = options.consts
        this.refreshInterval = options.refreshInterval ?? 30000
        this.maxPeers = options.maxPeers ?? 50
        this.key = this.consts.PRIVATE_KEY
        this.clientFilter = options.clientFilter ?? [
            'go1.5',
            'go1.6',
            'go1.7',
            'quorum',
            'pirl',
            'ubiq',
            'gmc',
            'gwhale',
            'prichain',
          ]
    }
    private async initDpt() {
        return new Promise<void>((resolve) => {
            this.dpt = new DPT(this.key, {
                refreshInterval: this.refreshInterval,
                endpoint: {
                    address: '0.0.0.0',
                    udpPort: null,
                    tcpPort: null,
                },
            })

            this.dpt.on('error', (e: Error) => { })
            this.dpt.on('listening', () => {
                resolve()
            })
        })
    }

    private async initRlpx() {
        return new Promise<void>((resolve) => {
            this.rlpx = new RLPx(this.key, {
                // clientId: Buffer.from(getClientVersion()),
                dpt: this.dpt!,
                maxPeers: this.maxPeers,
                capabilities: [ETH.eth66],  // only support eth66 now
                remoteClientIdFilter: this.clientFilter,
                // listenPort: this.port,
                common: this.consts.COMMON,
            })

            this.rlpx.on('peer:added', (peer) => {
            })

            this.rlpx.on('peer:removed', (rlpxPeer: Devp2pRLPxPeer, reason: any) => {
                const id = (rlpxPeer.getId() as Buffer).toString('hex')
                const peer = this.peers.get(id)
                if (peer) {
                    this.peers.delete(peer.id)
                    this.config.logger.debug(
                        `Peer disconnected (${rlpxPeer.getDisconnectPrefix(reason)}): ${peer}`
                    )
                    this.config.events.emit(Event.PEER_DISCONNECTED, peer)
                }
            })

            this.rlpx.on('peer:error', (rlpxPeer: Devp2pRLPxPeer, error: Error) => {
                const peerId = rlpxPeer.getId()
                if (peerId === null) {
                    return this.error(error)
                }
                this.error(error)
            })

            this.rlpx.on('error', (e: Error) => this.error(e))

            this.rlpx.on('listening', () => {
                this.config.events.emit(Event.SERVER_LISTENING, {
                    transport: this.name,
                    url: this.getRlpxInfo().enode ?? '',
                })
                resolve()
            })

            this.rlpx.listen(this.config.port, '0.0.0.0')
        })
    }
}