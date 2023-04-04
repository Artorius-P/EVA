import { Consts, ServerOptions } from "./interfaces"
import { DPT, RLPx, ETH } from '@ethereumjs/devp2p'
import { Logger } from "tslog"
import { Peer } from "@ethereumjs/devp2p"
export class Server {
    public consts: Consts
    public dpt: DPT | null = null
    public rlpx: RLPx | null = null
    public ip: string
    public port: number
    public refreshInterval: number
    public maxPeers: number
    public clientFilter: Array<string>
    public logger = new Logger()
    private started = false
    private key: Buffer
    // private peers: Map<string, Peer> = new Map()

    constructor(options: ServerOptions) {
        this.ip = options.ip ?? '0.0.0.0'
        this.consts = options.consts
        this.refreshInterval = options.refreshInterval ?? 30000
        this.maxPeers = options.maxPeers ?? 50
        this.port = options.port ?? 30303
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
    async start(): Promise<boolean> {
        if (this.started){
            return false
        }
        await this.initDpt()
        await this.initRlpx()
        this.started = true
        return true
    }
    async stop(): Promise<boolean> {
        if (this.started) {
            this.rlpx!.destroy()
            this.dpt!.destroy()
            this.started = false
        }
        return this.started
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

            this.dpt.on('error', (error: Error) => {
                this.logger.error(`DPT Error: ${error}`)
            })
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

            this.rlpx.on('peer:added', (peer: Peer) => {
                try {
                    const id = (peer.getId() as Buffer).toString('hex')
                    this.logger.info(`Peer connedted: ${id}`)
                } catch (error: any) {
                    this.logger.error(error)
                }
            })

            this.rlpx.on('peer:removed', (peer: Peer, reason: any) => {
                const id = (peer.getId() as Buffer).toString('hex')
                this.logger.info(`Peer disconnected: ${id}, Reason: ${reason}`)

            })

            this.rlpx.on('peer:error', (peer: Peer, error: Error) => {
                const id = (peer.getId() as Buffer).toString('hex')
                this.logger.info(`Peer error: ${id}, Error: ${error}`)
            })

            this.rlpx.on('error', (error: Error) => {
                this.logger.error(`RLPx Error: ${error}`)
            })

            this.rlpx.on('listening', () => {
                resolve()
            })

            this.rlpx.listen(this.port, this.ip)
        })
    }
}