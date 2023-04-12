import { DISCONNECT_REASONS, ETH, Peer, ETH as devp2pETH, int2buffer } from "@ethereumjs/devp2p";
import LRUCache from "lru-cache";
import { Logger } from "tslog";
import { getStatus } from "../utils";
import { arrToBufArr, bufferToHex } from "@ethereumjs/util";
import { TransactionFactory, TypedTransaction } from "@ethereumjs/tx";
import { Block, BlockHeader } from "@ethereumjs/block";
import { EthPeer } from "./peer";
import { Consts } from "../interfaces";
import ms from "ms";

const getPeerAddr = (peer: Peer) =>
  `${peer._socket.remoteAddress}:${peer._socket.remotePort}`;

export class EthHandler {
  public logger = new Logger({ minLevel: 2 })
  private txCache = new LRUCache({ max: 1000 })
  private blockCache = new LRUCache({ max: 100 })
  private peers: Map<string, EthPeer> = new Map()
  private consts: Consts

  async handle(peer: Peer) {
    let eth: devp2pETH | null = null
    const protocols = peer.getProtocols()
    for (const prot of protocols) {
      if (prot instanceof devp2pETH) {
        eth = prot
      }
    }
    if (eth !== null) {
      const addr = getPeerAddr(peer)
      const clientId = peer.getHelloMessage()?.clientId
      this.logger.info(`Add peer: ${addr} ${clientId} (eth${eth.getVersion()})`)
      const ethPeer = new EthPeer(eth, peer)
      this.peers.set(ethPeer.id, ethPeer)
      await this.handshake(ethPeer)
      await this.onMessage(ethPeer)
    }

  }
  handshake(ethPeer: EthPeer): Promise<void> {
    return new Promise((resolve) => {
      this.logger.debug("Handshake with peer")
      const status = getStatus({
        Network: "Mainnet",
        Fork: "London",
      })
      ethPeer.eth.sendStatus(status)
      ethPeer.eth.once("status", (status) => this.status(status, ethPeer))
      resolve()
    })
  }

  // Nodes should send status first
  status(status: any, ethPeer: EthPeer) {
    this.logger.debug(`besthash: ${status.bestHash.toString('hex')} forkid: ${status.forkId.toString('hex')}`)
    ethPeer.eth.sendMessage(devp2pETH.MESSAGE_CODES.GET_BLOCK_HEADERS, [
      Buffer.from([1]),
      [
        int2buffer(this.consts.CHECK_BLOCK_NR),
        Buffer.from([1]),
        Buffer.from([]),
        Buffer.from([]),
      ],
    ]);
    ethPeer.Timer = setTimeout(() => {
      ethPeer.disconnect(DISCONNECT_REASONS.USELESS_PEER)
    }, ms("15s"))
  }

  onMessage(ethPeer: EthPeer): Promise<void> {
    return new Promise((resolve, reject) => {
      ethPeer.eth.on("message", async (code: devp2pETH.MESSAGE_CODES, payload: any) => {
        try {
          this.message(ethPeer, code, payload)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  message(ethPeer: EthPeer, code: devp2pETH.MESSAGE_CODES, payload: any) {
    const MSG = devp2pETH.MESSAGE_CODES
    switch (code) {
      case MSG.NEW_BLOCK_HASHES:
        this.newBlockHash()
        break
      case MSG.TX:
        this.newTx(ethPeer, payload)
        break
      case MSG.NEW_POOLED_TRANSACTION_HASHES:
        this.newTxHash(ethPeer, payload)
        break
      case MSG.GET_BLOCK_HEADERS:
        this.getBlockHeaders()
        break
      case MSG.BLOCK_HEADERS:
        this.blockHeaders(ethPeer, payload)
        break
      case MSG.GET_BLOCK_BODIES:
        this.getBlockBodies()
        break
      case MSG.BLOCK_BODIES:
        this.BlockBodies()
        break
      case MSG.NEW_BLOCK:
        this.newBlock()
        break
      case MSG.GET_NODE_DATA:
        this.getNodeData()
        break
      case MSG.NODE_DATA:
        break
      case MSG.GET_RECEIPTS:
        this.getReceiptes()
        break
      case MSG.RECEIPTS:
        break
    }

  }
  newTxHash(ethPeer: EthPeer, payload: any) {
    if (!ethPeer.isVerified) return
    try {
      for (const item of payload) {
        const txHash = bufferToHex(item)
        this.logger.debug(`New txHash: ${txHash}`)
        //const arrTime = Date.now()
        //insert_tx({tx: tx, time: arrTime, id: peer.getId()?.toString("hex")});
        if (this.txCache.has(txHash))
          return
        else {
          // should request tx
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  newTx(ethPeer: EthPeer, payload: any) {
    if (!ethPeer.isVerified) return
    try {
      for (const item of payload) {
        const tx = TransactionFactory.fromBlockBodyData(item)
        if (isValidTx(tx)) {
          //const arrTime = Date.now()
          const txHashHex = tx.hash().toString("hex")
          this.logger.debug(`New tx: ${txHashHex}`)
          //insert_tx({tx: "0x"+txHashHex, time: arrTime,  id: peer.getId()?.toString("hex")});
          if (this.txCache.has(txHashHex))
            return
          this.txCache.set(txHashHex, true)
        }
      }
    } catch (e) {
      console.error(e)
    }

  }

  newBlockHash() {

  }

  getBlockHeaders() {

  }

  blockHeaders(ethPeer: EthPeer, payload: any) {
    if (!ethPeer.isVerified) {
      if (payload[1].length !== 1) {
        this.logger.error(`${ethPeer.id}expected one header for ${this.consts.CHECK_BLOCK_TITLE} verify (received: ${payload[1].length}`)
        ethPeer.disconnect(DISCONNECT_REASONS.USELESS_PEER)
        return
      }
      const expectedHash = this.consts.CHECK_BLOCK
      const common = this.consts.COMMON
      try {
        const header = BlockHeader.fromValuesArray(payload[1][0], { common });
        if (header.hash().toString("hex") === expectedHash) {
          console.log(
            `${ethPeer.id} verified to be on the same side of the ${this.consts.CHECK_BLOCK_TITLE}`,
          );
          clearTimeout(ethPeer.Timer);
          ethPeer.isVerified = true;
        }
      } catch (e) {
        this.logger.error(e)
      }
    }
  }

  getBlockBodies() {

  }

  BlockBodies() {

  }

  newBlock() { }
  getNodeData() { }
  getReceiptes() { }
  setConsts(consts: Consts) {
    this.consts = consts
  }
}

function isValidTx(tx: TypedTransaction) {
  return tx.validate()
}

