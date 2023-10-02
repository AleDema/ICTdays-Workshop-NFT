import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createClient } from "@connect2ic/core"
import { Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"
import * as DIP721 from "../.dfx/local/canisters/DIP721"
//import { idlFactory as ledgerFactory } from "./lib/ledger.did.js"
import {
  AstroX,
  ICX,
  defaultProviders,
  PlugWallet,
  InfinityWallet,
  NFID,
  StoicWallet,
  InternetIdentity,
  walletProviders,
} from "@connect2ic/core/providers"

let host = "https://mainnet.dfinity.network"
if (process.env.DFX_NETWORK !== "ic") {
  host = "http://127.0.0.1:4943";

}
console.log(`Network: ${host}`)
console.log(process.env.DIP721_CANISTER_ID)
// console.log(process.env)
//console.log(process.env?.NODE_ENV)

//console.log(import.meta.env.MOPS_ENV)
// console.log(import.meta.env.DEV)

const client = createClient({
  canisters: {
    DIP721
  },
  providers: [
    window.icx ? new ICX() :
      new AstroX(),
    new NFID(),
    //new PlugWallet(),
    //  new InternetIdentity(),
  ],
  globalProviderConfig: {
    dev: import.meta.env.DEV,
    // host: host,
    // whitelist: [process.env.DIP721_CANISTER_ID],
    appName: "Web3 Night Live",
  },
})

// console.log(defaultProviders)

ReactDOM.createRoot(document.getElementById('root')).render(
  <Connect2ICProvider client={client}>
    <App />
  </Connect2ICProvider>
);
