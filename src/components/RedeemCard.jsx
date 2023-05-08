import React from 'react'
import ckLogo from '../assets/ckbtc.webp';
import { useCanister } from "@connect2ic/react"
function RedeemCard(props) {

    const [nftCanister] = useCanister("DIP721")

    console.log(props)
    let state = "Active"
    let button = <button className='bg-[#0C93EA] w-full' onClick={props.redeemCoupon}>Redeem Coupon</button>
    if (props.state.frozen === null) {
        state = "Frozen"
        button = <button className='bg-[#5a0cea] w-full'>Coupon isn't active</button>
    } else if (props.state.redeemed === null) {
        state = "Redeemed"
        button = <button className='bg-[#ea610c] w-full'>Coupon has been redeemed</button>
    }
    return (
        <div className=" min-w-[284px] min-h-[475px]">
            <div className="nft">
                <div className='main'>
                    <img class='tokenImage' src='/ckbtc.webp' alt="Coupon" />
                    <p> ckBTC Coupon</p >
                    <p>Amount: {Number(props.amount)} ckSats</p>
                    <p>State: {state}</p>
                    <p>ID: {props.id}</p>
                    <hr className="mb-5" />
                    <div className='tokenInfo'>
                    </div>
                    {button}
                </div>
            </div>
        </div>
    )
}

export default RedeemCard