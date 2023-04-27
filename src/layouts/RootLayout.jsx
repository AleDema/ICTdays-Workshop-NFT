import React from 'react'
import { Outlet } from "react-router-dom";
import { ConnectButton, ConnectDialog } from "@connect2ic/react"
import Footer from '../components/Footer';
import { useSnapshot } from 'valtio'
import state from "../lib/state.js"
import {
  Link
} from "react-router-dom";
function RootLayout() {
  const snap = useSnapshot(state)
  return (
    <>
      <div className="bg-gray-900 w-screen min-h-screen flex flex-col overflow-auto flex-wrap">
        <div className="flex flex-row flex-wrap">
          <div className="self-start p-8 font-bold hidden  lg:block">
            <h1 className=''>Blockchain Week Minter</h1>
          </div>
          <div className='gap-4 flex p-8 font-bold self-center'>
            <Link to={`/`}>Home</Link>
            {state.isAdmin && <Link to={`/admin`}>Admin Panel</Link>}
          </div>
          <div className="flex flex-row justify-center items-center m-auto hidden lg:block">
            <span className="logo-stack">
              <img src="/dfinity_logo.png" alt="DFINITY Logo" className='max-w-[200px]' />

            </span>
          </div >
          <div className="self-end p-8 ml-auto">
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