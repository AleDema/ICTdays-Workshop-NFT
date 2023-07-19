import React, { useEffect } from 'react'
import { Outlet } from "react-router-dom";
import Footer from '../components/Footer';
import { useSnapshot } from 'valtio'
import state from "../lib/state.js"
import {
  Link
} from "react-router-dom";
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister, useWallet } from "@connect2ic/react"

function RootLayout() {
  const snap = useSnapshot(state)
  const [walletProvider] = useWallet()
  const { isConnected, principal, activeProvider, disconnect } = useConnect({
    onConnect: () => {
      // Signed in
      console.log("onConnect")
    },
    onDisconnect: () => {
      // Signed out
      console.log("onDisconnect")
      // disconnect()
    }
  })


  useEffect(() => {
    setTimeout(() => {
      //if (walletProvider?.meta?.name === "ICX")
      disconnect()
    }, 50)
  }, [])

  //console.log(state.isAdmin)
  return (
    <>
      <div className="w-screen min-h-screen flex flex-col overflow-auto flex-wrap">
        <div className="flex flex-row flex-wrap">
          {/* <div className="self-start p-8 font-bold hidden  lg:block">
            <h1 className=''>Blockchain Week Minter</h1>
          </div> */}
          <div className='gap-4 flex p-8 font-bold self-center'>
            <Link to={`/`}>Home</Link>
            {state.isAdmin && <Link to={`/admin`}>Admin Panel</Link>}
          </div>
          <div className="flex flex-row justify-center items-center m-auto hidden lg:block">
            {/* <span className="logo-stack">
              <img src="/dfinity_logo.png" alt="DFINITY Logo" className='max-w-[200px]' />

            </span> */}
          </div >
          <div className=" pr-3 ml-auto self-center">
            <ConnectButton />
            <ConnectDialog />
          </div>
        </div>
        <Outlet></Outlet>
        <Footer />
      </div>
    </>
  )
}

export default RootLayout