import React from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister } from "@connect2ic/react"
import CouponCard from '../components/CouponCard';
import { useLocation } from 'react-router-dom';
function RedeemPage() {
    const location = useLocation();
    const { isConnected, principal, activeProvider } = useConnect({
        onConnect: () => {
            // Signed in
            console.log("onConnect")
        },
        onDisconnect: () => {
            // Signed out
            console.log("onDisconnect")
        }
    })
    const [response, setResponse] = React.useState(null)
    const [coupon, setCoupon] = React.useState(null)
    const [nftCanister] = useCanister("DIP721")
    const navigate = useNavigate();
    let { id } = useParams();

    const redeemCoupon = async () => {
        let res = await nftCanister.redeemCoupon(id)
        console.log(res)
        setResponse(res.ok || res.err)
        if (res.ok) {
            setResponse("Success! You claimed the coupon, check your wallet.")
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
                        <p>{response}</p>
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