import React, { Suspense } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useConnect, useCanister } from "@connect2ic/react"
import NftCard from '../components/NftCard';
function ClaimPage() {

    const { isConnected, principal, activeProvider } = useConnect({
        onConnect: () => {
            // Signed in
            //console.log("onConnect")
        },
        onDisconnect: () => {
            // Signed out
            //console.log("onDisconnect")
        }
    })
    const [response, setResponse] = React.useState(null)
    const [nftCanister] = useCanister("DIP721")
    const [event, setEvent] = React.useState(null)
    const navigate = useNavigate();
    let { id } = useParams();

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
                <div className="flex flex-col">
                    {event && <NftCard setResponse={setResponse} isClaim={true} id={id} description={event?.description} mimeType={event?.nftType || "img"} key={id} name={event?.nftName} url={event?.nftUrl} state={event.state}></NftCard>}
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