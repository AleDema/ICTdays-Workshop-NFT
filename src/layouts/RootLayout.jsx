import React from 'react'
import { Outlet } from "react-router-dom";

function RootLayout() {
  return (
    <>
      <Outlet></Outlet>
    </>
  )
}

export default RootLayout