import React, { Suspense } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useConnect, useCanister } from "@connect2ic/react"
import EventCard from '../components/EventCard';
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
    const [event, setEvent] = React.useState(null)
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
        }, 4000)
    }

    React.useEffect(() => {
        const init = async () => {
            let nftdata = await nftCanister.getEvent(id);
            setEvent(nftdata.ok)
            console.log(nftdata)
        }
        init()

    }, []);

    return (
        <div className="flex items-center justify-center">
            {isConnected ?
                <div lassName="flex flex-col">
                    <Suspense fallback={<div>Loading...</div>}>
                        <EventCard claimNft={claimNft} isClaim={true} id={id} mimeType={event?.nftType || "img"} key={id} name={event?.nftName} url={event?.nftUrl}></EventCard>
                    </Suspense>
                    {response &&
                        <p>{response}</p>
                    }
                </div>
                :
                <>
                    <h2>Login to claim NFT</h2>
                </>
            }
        </div >
    )
}

export default ClaimPage