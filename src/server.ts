import { Consts, ServerOptions } from "./interfaces"
import { DPT, RLPx, ETH } from '@ethereumjs/devp2p'
import { Logger } from "tslog"
import { Peer } from "@ethereumjs/devp2p"
import { Handler } from "./handler"
export class Server {
    public consts: Consts
    public dpt: DPT | null = null
    public rlpx: RLPx | null = null
    public ip: string
    public port: number
    public refreshInterval: number
    public maxPeers: number
    public clientFilter: Array<string>
    public logger = new Logger({
        minLevel: 5
    })
    public handler: Handler
    private key: Buffer
    // private peers: Map<string, Peer> = new Map()

    constructor(options: ServerOptions, handler: Handler) {
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
        this.handler = handler
        this.handler.setConsts(this.consts)
    }

    async start(): Promise<void> {
        await this.initDpt()
        await this.initRlpx()
    }

    private async initDpt() {
        const bootstrapNodes = this.consts.COMMON.bootstrapNodes();
        const BOOTNODES = bootstrapNodes.map((node: any) => {
            return {
                address: node.ip,
                udpPort: node.port,
                tcpPort: node.port,
            };
        });
        return new Promise<void>((resolve) => {
            this.dpt = new DPT(this.key, {
                refreshInterval: this.refreshInterval,
                endpoint: {
                    address: '0.0.0.0',
                    udpPort: null,
                    tcpPort: null,
                },
            })

            for (const bootnode of BOOTNODES) {
                this.dpt.bootstrap(bootnode).catch((err) => {
                  this.logger.error(err);
                });
              }

            this.dpt.on('error', (error: Error) => {
                this.logger.debug(`DPT Error: ${error}`)
            })
            this.dpt.on('listening', () => {
                resolve()
            })
        })
    }

    private async initRlpx() {
        return new Promise<void>(() => {
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
                console.log("peer:added")
                try {
                    this.handler.handleAdd(peer)
                } catch (error: any) {
                    this.logger.error(error)
                }
            })

            this.rlpx.on('peer:removed', (peer: Peer, reason: any) => {
                this.handler.handleRemove(peer, reason)
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

            this.rlpx.listen(this.port, this.ip)
        })
    }
}