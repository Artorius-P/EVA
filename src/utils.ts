import { randomBytes } from "crypto";
import { Config, Consts, ServerOptions } from "./interfaces";
import {existsSync, readFileSync} from "fs"
import { Chain, Common, Hardfork } from "@ethereumjs/common";
function getConsts(config: Config): Consts {
    let consts: Consts = {
        CHECK_BLOCK_TITLE: "London Fork",
        CHECK_BLOCK_NR: 12965000,
        CHECK_BLOCK: "9b83c12c69edb74f6c8dd5d052765c1adf940e320bd1291696e6fa07829eee71",
        CHECK_BLOCK_HEADER: "0xf9021fa03de6bb3849a138e6ab0b83a3a00dc7433f1e83f7fd488e4bba78f2fe2631a633a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347947777788200b672a42421017f65ede4fc759564c8a041cf6e8e60fd087d2b00360dc29e5bfb21959bce1f4c242fd1ad7c4da968eb87a0dfcb68d3a3c41096f4a77569db7956e0a0e750fad185948e54789ea0e51779cba08a8865cd785e2e9dfce7da83aca010b10b9af2abbd367114b236f149534c821db9010024e74ad77d9a2b27bdb8f6d6f7f1cffdd8cfb47fdebd433f011f7dfcfbb7db638fadd5ff66ed134ede2879ce61149797fbcdf7b74f6b7de153ec61bdaffeeb7b59c3ed771a2fe9eaed8ac70e335e63ff2bfe239eaff8f94ca642fdf7ee5537965be99a440f53d2ce057dbf9932be9a7b9a82ffdffe4eeee1a66c4cfb99fe4540fbff936f97dde9f6bfd9f8cefda2fc174d23dfdb7d6f7dfef5f754fe6a7eec92efdbff779b5feff3beafebd7fd6e973afebe4f5d86f3aafb1f73bf1e1d0cdd796d89827edeffe8fb6ae6d7bf639ec5f5ff4c32f31f6b525b676c7cdf5e5c75bfd5b7bd1928b6f43aac7fa0f6336576e5f7b7dfb9e8ebbe6f6efe2f9dfe8b3f56871b81c1fe05b21883c5d4888401ca35428401ca262984610bdaa69768747470733a2f2f7777772e6b7279707465782e6f7267a09620b46a81a4795cf4449d48e3270419f58b09293a5421205f88179b563f815a88b223da049adf2216843b9aca00",
        PRIVATE_KEY: randomBytes(32),
        COMMON: new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
    }
    if ("Key" in config) {
        // TODO: add privite key support
    }
    if (config["Network"] === "Mainnet") {
        if (config["Fork"] === "Berlin") {
            // TODO: add berlin fork and other network support
        }
    }
    return consts
}

function getConfig(path: string): Config {
    let config: Config = {
        Network: "Mainnet",
        Fork: "London",
    }
    if (existsSync(path)){
        config = JSON.parse(readFileSync(path, "utf8"))
    }
    return config
}

export function getOptions(path: string): ServerOptions {
    const config = getConfig(path)
    const consts = getConsts(config)
    const options: ServerOptions = {
        consts: consts,
        ip: config.IP,
        port: config.ListenPort
    }
    return options
}