import React from 'react'
import { Link } from "react-router-dom";
import ckLogo from '../assets/ckbtc.webp';

function CouponCard(props) {

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
        <div className="flex flex-col items-center justify-center">
            <div className='flex flex-col  justify-center h-fit p-6 max-w-md rounded-l border-orange-500 border gap-4 m-7 text-left'>
                < p className="font-bold" > ckBTC Coupon</p >
                <p className="font-bold">Amount: {props.amount} ckBTC</p>
                <p className="font-bold">State: {state}</p>
                <p className="font-bold">ID: {props.id}</p>
                <img className=' object-fill h-72 w-96' src={ckLogo} alt="Image" />
                {
                    props.isClaim ?
                        <>
                            {button}
                        </>
                        :
                        <Link to={`/redeemcoupon/${props.id}`} key={props.id} >
                            <button className="ml-2 mb-2 bg-[#0C93EA]">Go to page</button>
                        </Link>
                }
            </div >
        </div >
    )
}

export default CouponCard