import React from 'react'
import ckLogo from '../assets/ckbtc.webp';
import { useCanister, useConnect, useWallet } from "@connect2ic/react"
import { Principal } from '@dfinity/principal';
import { useNavigate, useParams } from 'react-router-dom';
function RedeemCard(props) {

    const [nftCanister] = useCanister("DIP721")
    const [walletProvider] = useWallet()
    const [loading, setLoading] = React.useState(false)
    const [response, setResponse] = React.useState("none")
    const [responseText, setResponseText] = React.useState()
    const navigate = useNavigate();
    const redeemCoupon = async () => {
        setResponse("none")
        setLoading(true)
        let res;
        if (walletProvider?.meta?.name === "ICX") {
            //setResponse(walletProvider?.wallets[0].principal)
            //setResponse("Redeeming")
            let principal = Principal.fromText(walletProvider?.wallets[0].principal)
            res = await nftCanister.redeemCouponToPrincipal(props.id, principal)
        }
        else {
            res = await nftCanister.redeemCoupon(props.id)
        }
        setLoading(false)
        if (res.ok) {
            setResponse("success")
            //setResponse(res.ok)
        } else if (res.err) {
            setResponse("error")
            setResponseText(res.err)
            setTimeout(() => {
                window.location.reload();
            }, 3000)
            //setResponse(res.err)
        }
    }

    console.log(props)
    let state = "Active"
    let button = loading ?

        <a href="#" className="btn btn-cart btn-outline" >
            <span>
                Redeeming...
            </span>
        </a>
        :
        <>
            <a href="#" className="btn btn-cart btn-outline" onClick={redeemCoupon}>
                {response === "success" &&
                    <span>
                        Success! Check your wallet
                    </span>
                }

                {response === "none" &&
                    <span>
                        Redeem Coupon
                    </span>
                }

                {response === "error" &&
                    <span>
                        {responseText}
                    </span>
                }
            </a>
        </>
    if (props.state.frozen === null) {
        state = "Frozen"
        button = <button className='bg-[#5a0cea] w-full'>Coupon isn't active</button>
    } else if (props.state.redeemed === null) {
        state = "Redeemed"
        button = <button className='bg-[#ea610c] w-full'>Coupon has been redeemed :(</button>
    }
    return (
        <>
            <div className=" min-w-[302px] min-h-[475px]">
                <div className="nft">
                    <div className='main'>
                        <img className='tokenImage' src='/ckbtc.webp' alt="Coupon" />
                        <p className='description font-bold text-lg'> ckBTC Coupon</p >
                        <span className="flex flex-col items-baseline mb-5 m-auto">
                            <div><span className='description text-lg'>Amount: </span><span>{Number(props.amount)} ckSats</span></div>
                            <div><span className='description text-lg'>State: </span><span>{state}</span></div>
                            <div><span className='description text-lg'>ID: </span><span>{props.id}</span></div>
                        </span>
                        <hr className="mb-5" />
                        <div className='tokenInfo'>
                        </div>
                        {button}
                    </div>
                </div>
            </div>
        </>
    )
}

export default RedeemCard