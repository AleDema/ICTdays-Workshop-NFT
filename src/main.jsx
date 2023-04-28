import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { defaultProviders } from "@connect2ic/core/providers"
import { createClient } from "@connect2ic/core"
import { Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"
import * as DIP721 from "../.dfx/local/canisters/DIP721"
//import { idlFactory as ledgerFactory } from "./lib/ledger.did.js"

let host = "https://mainnet.dfinity.network"
if (process.env.DFX_NETWORK !== "ic") {
  host = "http://127.0.0.1:4943";

}
console.log(`Network: ${host}`)
console.log(process.env.DIP721_CANISTER_ID)

// console.log(process.env.FRONTEND_CANISTER_ID)
// console.log(import.meta.env.DEV)

const client = createClient({
  canisters: {
    DIP721
  },
  providers: defaultProviders,
  globalProviderConfig: {
    dev: import.meta.env.DEV,
    whitelist: [process.env.DIP721_CANISTER_ID, process.env.FRONTEND_CANISTER_ID],
    appName: "ICP PoAP",
    autoConnect: false,
  },
})

// console.log(defaultProviders)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Connect2ICProvider client={client}>
      <App defaultProviders={defaultProviders} />
    </Connect2ICProvider>
  </React.StrictMode>,
);
