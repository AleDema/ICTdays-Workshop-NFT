import React from 'react'

function Footer() {

  return (
    <div className=' mt-auto w-screen flex flex-col items-center justify-center pb-10'>
      <div className='flex flex-row items-center justify-center max-w-2xl w-full mx-auto'>

        <a href="https://t.me/Web3NightLive" target='_blank' className='text-white flex flex-row items-center gap-2'>
          <img src='/telegram.png' alt="Web3 Night Live Telegram Channel" className='h-[24px]' />
          WEB3 NIGHT LIVE
        </a>

      </div>
    </div>
  )
}

export default Footer
