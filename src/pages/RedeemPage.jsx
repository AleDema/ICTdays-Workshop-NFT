import React from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useConnect, useCanister, useWallet } from "@connect2ic/react"
import { useLocation } from 'react-router-dom';
import RedeemCard from '../components/RedeemCard';

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
    const [coupon, setCoupon] = React.useState(null)
    const [nftCanister] = useCanister("DIP721")
    const navigate = useNavigate();
    let { id } = useParams();


    React.useEffect(() => {
        const init = async () => {
            let couponData = await nftCanister.getCoupon(id);
            setCoupon(couponData.ok)
            //console.log(couponData)
        }
        init()

    }, []);

    return (
        <>
            {isConnected ?
                <>
                    {
                        coupon ?
                            <RedeemCard id={id} amount={Number(coupon?.amount) || 0} state={coupon?.state || {}}></RedeemCard>
                            :
                            <p>Loading...</p>
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