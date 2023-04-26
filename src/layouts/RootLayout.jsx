import React from 'react'
import { Outlet } from "react-router-dom";
import { ConnectButton, ConnectDialog } from "@connect2ic/react"
import Footer from '../components/Footer';

function RootLayout() {
  return (
    <>
      <div className="bg-gray-900 w-screen h-[100vh] flex flex-col overflow-auto ">
        <div className="flex flex-row">
          <div className="self-start p-8 font-bold">
            <h1>Blockchain Week Minter</h1>
          </div>
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