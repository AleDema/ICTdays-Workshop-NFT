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

    // if (!isConnected) {
    //     navigate('/');
    //     return null;
    // }

    const claimNft = async () => {
        let res = await nftCanister.claimEventNft(id)
        console.log(res)
        setResponse(res.ok || res.err)
        const timeout = setTimeout(() => {
            navigate('/');
        }, 2000)
        //clearTimeout(timeout)
    }

    return (
        <div className="bg-gray-900 w-screen h-[90vh] flex flex-col overflow-auto ">
            <div className="flex flex-row">
                <div className="self-start p-8 font-bold">
                    <h1>Blockchain Week Minter</h1>
                </div>
                <div className="self-end p-8 ml-auto">
                    <ConnectButton />
                    <ConnectDialog />
                </div>
            </div>
            <div>ClaimPage</div>
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
        </div>
    )
}

export default ClaimPage