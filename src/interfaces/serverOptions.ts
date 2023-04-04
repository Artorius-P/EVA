import { Consts } from "./consts";

export interface ServerOptions {
    consts: Consts,
    ip?: string,
    port?: number,
    refreshInterval?: number
    maxPeers?: number
    clientFilter?: Array<string>
}