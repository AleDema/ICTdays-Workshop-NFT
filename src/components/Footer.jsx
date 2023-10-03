import React from 'react'

function Footer() {

    return (
      <div className='w-screen flex flex-col items-center justify-center bg-gray-900 pb-10'>

        <div className='flex flex-row items-center justify-between max-w-2xl w-full mx-auto'>

          <a href="https://t.me/Web3NightLive" target='_blank' className='text-white flex flex-row items-center gap-2'>
            <img src='/telegram.png' alt="Telegram" className='h-[24px]' />
            WEB3 NIGHT LIVE
          </a>

        </div>
      </div>
    )
}

export default Footer
