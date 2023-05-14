import { useEffect, useState, useRef } from 'react';
import './index.css';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import { Principal } from '@dfinity/principal';
import RootLayout from './layouts/RootLayout';
import Card from './components/Card';
import ErrorPage from './pages/ErrorPage';
import AdminPage from './pages/AdminPage';
import RedeemPage from './pages/RedeemPage';
import ClaimPage from './pages/ClaimPage';
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister, useWallet } from "@connect2ic/react"
import {
  createRoutesFromElements, Link, createBrowserRouter,
  RouterProvider,
  Route
} from "react-router-dom";
import { useSnapshot } from 'valtio'
import state from "./lib/state.js"
import NftCard from './components/NftCard';
//import { idlFactory as ledgerFactory } from "./lib/ledger.did.js"

function App(props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustodian, setIsCustodian] = useState(false);
  //const [ledgerCanister, setLedgerCanister] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [nftCanister] = useCanister("DIP721")
  //const [ledgerCanister] = useCanister("ledger")
  const snap = useSnapshot(state)
  const [walletProvider] = useWallet()
  const { isConnected, principal, activeProvider } = useConnect({
    onConnect: () => {
      // Signed in
      //console.log("onConnect")
    },
    onDisconnect: () => {
      // Signed out
      //console.log("onDisconnect")
      disconnect()
    }
  })

  useEffect(() => {
    if (isConnected) {
      console.log('walletProvider', walletProvider)
      console.log('activeProvider', activeProvider)

    }
  }, [isConnected])

  const disconnect = async () => {
    //clean up state
    setIsCustodian(false)
    state.isAdmin = false;
    setLoading(true)
    // setLedgerCanister(null)
    setNfts([])
  }


  const transferNft = async (id, address) => {
    console.log(`Transfer to: ${address} NFT with id: ${id}`)
    let receipt = await nftCanister.transferFromDip721(Principal.fromText(principal), Principal.fromText(address), id)
    if (!receipt.Ok) return;
    setNfts((oldNfts) => {
      return oldNfts.filter((item, i) => item.token_id !== id);
    })
  }

  const fetchData = async () => {
    // console.log(`principal ${principal}`)
    // console.log("nftCanister")
    // console.log(nftCanister)
    if (nftCanister === null || principal === undefined) return
    const ids = await nftCanister.getTokenIdsForUserDip721(Principal.fromText(principal))
    const newArray = []
    for (const id of ids) {
      newArray.push(Number(id))
    }
    console.log(ids)
    const newNfts = await Promise.all(newArray.map(async (item) => {
      let value = await nftCanister.getMetadataDip721(item)
      value.Ok.token_id = item
      return value.Ok
    }))
    console.log("NFTs:")
    console.log(newNfts)
    setNfts(newNfts)
  }

  useEffect(() => {
    const init = async () => {
      if (nftCanister === null || principal === undefined) return
      console.log("HELLO")
      console.log(principal)
      setLoading(true)
      await fetchData();
      setLoading(false)
      let check = await nftCanister.isCustodian();
      setIsCustodian(check);
      state.isAdmin = check;
    }
    init()
    const intervalId = setInterval(async () => {
      fetchData()
    }, 15000);

    return () => clearInterval(intervalId);
  }, [principal]);

  return (
    < >
      {principal !== undefined && nftCanister !== null &&
        <>
          {/* <p>{principal}</p> */}

          <h2 className='font-bold text-lg'>My Collection</h2>
          {
            nfts.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-10 justify-around m-auto">
                {
                  nfts.map((e, i) => {
                    let name, description, url, mimeType, nftId;
                    //console.log(e)
                    e[0].key_val_data.forEach((item, index) => {
                      if (item.key == "name") name = item.val.TextContent;
                      else if (item.key == "location") url = item.val.TextContent;
                      else if (item.key == "contentType") mimeType = item.val.TextContent;
                      else if (item.key == "nftId") nftId = Number(item.val.NatContent);
                      else if (item.key == "description") description = item.val.TextContent;
                    })
                    return (
                      // <Card tokenId={e.token_id} mimeType={mimeType} key={e.token_id} name={name} url={url} transfer={transferNft}></Card>
                      <NftCard setNfts={setNfts} tokenId={e.token_id} nftId={nftId} description={description} mimeType={mimeType} key={e.token_id} name={name} url={url} transfer={transferNft} isClaim={false}></NftCard>
                    )
                  })
                }
              </div>) : 
                loading ? 
                <div className="flex justify-center items-center mt-5"> Loading NFTs...</div>
                :
                <div className="flex justify-center items-center mt-5" >You don't have any NFTs</div>

              
            
          }
        </>
      }

      {
        principal === undefined && <>
          <p>Login to interact...</p>
        </>
      }
    </ >
  );
}

const router = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<RootLayout />} errorElement={<ErrorPage />}>
    <Route index element={<App />} />
    <Route path="/redeemcoupon/:id" element={<RedeemPage />} />
    <Route path="/claimnft/:id" element={<ClaimPage />} />
    <Route path="/admin" element={<AdminPage />} />
  </Route>
));


export default () => (
  <RouterProvider router={router} />
)