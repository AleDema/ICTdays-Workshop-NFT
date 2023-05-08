import React from 'react'
import ckLogo from '../assets/ckbtc.webp';
import { useCanister } from "@connect2ic/react"
function RedeemCard(props) {

    const [nftCanister] = useCanister("DIP721")

    console.log(props)
    let state = "Active"
    let button =
        <>
            <a href="#" class="btn btn-cart btn-outline" onClick={props.redeemCoupon}>
                <span>
                    Redeem Coupon
                </span>
            </a>
        </>
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
                    <img className='tokenImage' src='/ckbtc.webp' alt="Coupon" />
                    <p className='description font-bold'> ckBTC Coupon</p >
                    <span>
                        <span><p className='description'>Amount: </p><p>{Number(props.amount)} ckSats</p></span>
                        <p>State: {state}</p>
                        <p>ID: {props.id}</p>
                    </span>
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