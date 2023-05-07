import React from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister, useWallet } from "@connect2ic/react"
import CouponCard from '../components/CouponCard';
import { useLocation } from 'react-router-dom';
import { Principal } from '@dfinity/principal';

function RedeemPage() {
    const location = useLocation();
    const { isConnected, principal, activeProvider } = useConnect({
        onConnect: () => {
            // Signed in
            // console.log("onConnect")
        },
        onDisconnect: () => {
            // Signed out
            // console.log("onDisconnect")
        }
    })
    const [walletProvider] = useWallet()
    const [response, setResponse] = React.useState(null)
    const [coupon, setCoupon] = React.useState(null)
    const [nftCanister] = useCanister("DIP721")
    const navigate = useNavigate();
    let { id } = useParams();

    const redeemCoupon = async () => {
        //let res = await nftCanister.redeemCoupon(id)
        // walletProvider.createActor
        //setResponse(JSON.stringify(walletProvider.ICX || "NOOOOOOOOOOOOOOOOOOOOO"))
        //  setResponse(JSON.stringify(walletProvider))
        // setResponse(` ${walletProvider?.meta?.name}`)
        // console.log(walletProvider)
        // const ledgerActor = await walletProvider.createActor(process.env.DIP721_CANISTER_ID, ledgerFactory)
        //console.log(ledgerActor)
        //setResponse("2")
        let res;
        if (walletProvider?.meta?.name === "ICX") {
            //setResponse(walletProvider?.wallets[0].principal)
            setResponse("Redeeming")
            let principal = Principal.fromText(walletProvider?.wallets[0].principal)
            res = await nftCanister.redeemCouponToPrincipal(id, principal)
        }
        else {
            //setResponse("3")
            res = await nftCanister.redeemCoupon(id)
        }
        //setResponse("3")
        // console.log(res)
        // setResponse(JSON.stringify(res))
        //setResponse(res.ok || res.err)
        if (res.ok) {
            //setResponse("Success! You claimed the coupon, check your wallet.")
            setResponse(res.ok)
        } else if (res.err) {
            setResponse(res.err)
        }
        // const timeout = setTimeout(() => {
        //     navigate('/');
        // }, 3000)
        //clearTimeout(timeout)
    }


    React.useEffect(() => {
        const init = async () => {
            let couponData = await nftCanister.getCoupon(id);
            setCoupon(couponData.ok)
            console.log(couponData)
        }
        init()

    }, []);

    return (
        <>
            {isConnected ?
                <>
                    <CouponCard redeemCoupon={redeemCoupon} isClaim={true} id={id} amount={Number(coupon?.amount) || 0} state={coupon?.state || {}}></CouponCard>
                    {response &&
                        <p className='break-normal'>{response}</p>
                    }
                </>
                :
                <>
                    <h2>Login to claim coupon</h2>
                </>
            }
        </>
    )
}

export default RedeemPage