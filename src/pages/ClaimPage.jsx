import React from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister } from "@connect2ic/react"
function ClaimPage() {

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
    const [nftCanister] = useCanister("DIP721")
    const navigate = useNavigate();
    let { id } = useParams();

    const claimNft = async () => {
        let res = await nftCanister.claimEventNft(id)
        console.log(res)
        setResponse(res.ok || res.err)
        if (res.ok) {
            setResponse("Success! You claimed an NFT")
        } else if (res.err) {
            setResponse(res.err)
        }
        const timeout = setTimeout(() => {
            navigate('/');
        }, 2000)
        //clearTimeout(timeout)
    }

    return (
        <>
            {isConnected ?
                <>
                    <button className='bg-[#0C93EA] w-full' onClick={claimNft}>Claim NFT</button>
                    {response &&
                        <p>{response}</p>
                    }
                </>
                :
                <>
                    <h2>Login to claim NFT</h2>
                </>
            }
        </>
    )
}

export default ClaimPage