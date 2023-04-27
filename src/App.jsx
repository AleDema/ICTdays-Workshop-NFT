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
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister } from "@connect2ic/react"
import {
  createRoutesFromElements, Link, createBrowserRouter,
  RouterProvider,
  Route
} from "react-router-dom";
import { useSnapshot } from 'valtio'
import state from "./lib/state.js"

function App(props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCustodian, setIsCustodian] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [nftCanister] = useCanister("DIP721")
  const snap = useSnapshot(state)
  const { isConnected, principal, activeProvider } = useConnect({
    onConnect: () => {
      // Signed in
      console.log("onConnect")
    },
    onDisconnect: () => {
      // Signed out
      console.log("onDisconnect")
      disconnect()
    }
  })

  const disconnect = async () => {
    //clean up state
    setIsCustodian(false)
    state.isAdmin = false;
    setLoading(null)
    setNfts([])
  }


  const transferNft = async (id, address) => {
    console.log(`Transfer to: ${address} NFT with id: ${id}`)
    let receipt = await nftCanister.transferFromDip721(principal, Principal.fromText(address), id)
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
    const newNfts = await Promise.all(ids.map(async (item) => {
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
      if (nftCanister === null) return
      let check = await nftCanister.isCustodian();
      setIsCustodian(check);
      state.isAdmin = check;
      fetchData();
    }
    init()
    const intervalId = setInterval(async () => {
      fetchData()
    }, 15000);

    return () => clearInterval(intervalId);
  }, [nftCanister, principal]);

  return (
    < >
      {principal !== undefined && nftCanister !== null &&
        <>
          <h2>NFTS</h2>
          {
            nfts.length > 0 ? (
              <div className="flex flex-row flex-wrap px-10">
                {
                  nfts.map((e, i) => {
                    let name, url, mimeType;
                    //console.log(e)
                    e[0].key_val_data.forEach((item, index) => {
                      if (item.key == "name") name = item.val.TextContent;
                      else if (item.key == "location") url = item.val.TextContent;
                      else if (item.key == "contentType") mimeType = item.val.TextContent;
                    })
                    return (
                      <Card tokenId={e.token_id} mimeType={mimeType} key={e.token_id} name={name} url={url} transfer={transferNft}></Card>
                    )
                  })
                }
              </div>) : (<div className="flex justify-center items-center" >You don't have any NFTs</div>)
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