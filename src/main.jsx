import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Footer from './components/Footer';
import { defaultProviders } from "@connect2ic/core/providers"
import { createClient } from "@connect2ic/core"
import { Connect2ICProvider } from "@connect2ic/react"
import "@connect2ic/core/style.css"


const client = createClient({
  providers: defaultProviders,
  globalProviderConfig: {
    // host: 'http://localhost:3000',
    // dev: import.meta.env.DEV,
    dev: import.meta.env.DEV,
    // ledgerCanisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
    // ledgerHost: "http://localhost:8000",
    // whitelist: ["ryjl3-tyaaa-aaaaa-aaaba-cai"],
    // delegationModes:['global'],
    whitelist: ['3xzez-taaaa-aaaap-qbapa-cai', "362pf-fiaaa-aaaap-qbaoq-cai"],
  },
})

// console.log(defaultProviders)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Connect2ICProvider client={client}>
      <App defaultProviders={defaultProviders} />
    </Connect2ICProvider>
    <Footer />
  </React.StrictMode>,
);
