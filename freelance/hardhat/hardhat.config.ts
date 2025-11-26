import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";
// import { localhost,hoodi } from "viem/chains";
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
      },
      production: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545/",
      
    },
    hoodi: {
      type: "http",
      chainType: "l1",
      url: configVariable("HOODI_URL"),
      accounts: [configVariable("HOODI_PRIVATE_KEY")],
    },
    
  },
});
