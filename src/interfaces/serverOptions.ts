import { Consts } from "./consts";

export interface ServerOptions {
    consts: Consts,
    ip?: string,
    refreshInterval?: number
    maxPeers?: number
    clientFilter?: Array<string>
}