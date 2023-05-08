import React from 'react'

function Footer() {

  return (
    <div className=' mt-auto w-screen flex flex-col items-center justify-center pb-10'>
      <div className='flex flex-row items-center justify-between max-w-2xl w-full mx-auto'>

        <a href="https://t.me/ICP_Italia" target='_blank' className='text-white flex flex-row items-center gap-2'>
          <img src='/telegram.png' alt="Telegram" className='h-[24px]' />
          ICP Italia
        </a>

        <a href="https://dfinity.org/" target='_blank' className='text-white flex flex-row items-center gap-2'>
          <img src='/dfinity_logo.png' alt="DFINITY" className='h-[24px]' />
          DFINITY Foundation
        </a>


        <a href="https://internetcomputer.org/" target='_blank' className='text-white flex flex-row items-center gap-1'>
          <img src='/dfinity_logo.png' alt="DFINITY" className='h-[24px]' />
          Internet Computer
        </a>

      </div>
    </div>
  )
}

export default Footer