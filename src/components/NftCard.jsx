import React from 'react'
import '../index.scss';
import { useCanister, useConnect } from "@connect2ic/react"
import { useRef } from 'react'
import { Principal } from '@dfinity/principal';
import { useNavigate, useParams } from 'react-router-dom';

function FileRenderer(props) {
    const { mimeType, src } = props;

    switch (mimeType.split('/')[0]) {
        case 'image':
            return <img className='tokenImage' src={src} alt="NFT" />;
        case 'audio':
            return <audio className=' object-fill h-56 w-96' controls><source src={src} type={mimeType} /></audio>;
        case 'video':
            return <video className=' object-fill h-56 w-96' controls><source src={src} type={mimeType} /></video>;
        default:
            return <div>Unsupported file type</div>;
    }
}

function NftCard(props) {

    const [nftCanister] = useCanister("DIP721")
    const addressField = useRef(null)
    const [loading, setLoading] = React.useState(false)
    const [response, setResponse] = React.useState()
    const { isConnected, principal, activeProvider } = useConnect()
    const navigate = useNavigate();
    // let { id } = useParams();

    const claimNft = async () => {
        setResponse()
        setLoading(true)
        let res = await nftCanister.claimEventNft(props.id)
        setLoading(false)
        console.log(res)
        //props.setResponse(res.ok || res.err)
        if (res.ok) {
            setResponse("Success! You claimed an NFT")
        } else if (res.err) {
            setResponse(res.err)
        }
        const timeout = setTimeout(() => {
            navigate('/');
        }, 4000)
    }

    const transferNft = async () => {
        setResponse()
        setLoading(true)
        console.log(`Transfer to: ${addressField?.current?.value} NFT with id: ${props.tokenId}`)
        let receipt
        try {
            receipt = await nftCanister.transferFromDip721(Principal.fromText(principal), Principal.fromText(addressField?.current?.value), props.tokenId)
        } catch (e) {
            setResponse("Invalid Address!")
            console.log(e)
        }
        setLoading(false)
        if (!receipt?.Ok) return;
        props.setNfts((oldNfts) => {
            return oldNfts.filter((item, i) => item.token_id !== props.tokenId);
        })
    }

    return (
        <>
            <div className='flex flex-col '>
                <div className=" min-w-[302px] min-h-[475px]">
                    <div className="nft">
                        <div className='main'>
                            <FileRenderer src={props.url} mimeType={props.mimeType}></FileRenderer>
                            {
                                props.isClaim ?
                                    <h2>{props.name}</h2>
                                    :
                                    <h2>{props.name} #{props.nftId}</h2>
                            }
                            <p className='description'>{props.description}</p>
                            <hr className="mb-5" />
                            <div className='tokenInfo'>
                            </div>
                            {
                                props.isClaim ?
                                    <>
                                        <a href="#" className="btn btn-cart btn-outline" onClick={claimNft}>
                                            {loading ?
                                                <span>
                                                    Loading...
                                                </span>
                                                :
                                                <span>
                                                    Claim NFT
                                                </span>
                                            }
                                        </a>
                                    </>
                                    :
                                    <>
                                        <div className='flex flex-col items-start gap-2 w-full'>
                                            <input type="text" className="px-2 py-1 rounded-lg w-full" placeholder='Recipient address' ref={addressField}></input>
                                            <p className='text-[12px] font-thin opacity-70 pb-2'>Insert the address that will receive the NFT</p>
                                        </div>
                                        <a href="#" className="btn btn-cart btn-outline" onClick={transferNft}>
                                            {loading ?
                                                <span>
                                                    Loading...
                                                </span>
                                                :
                                                <span>
                                                    Transfer
                                                </span>
                                            }
                                        </a>
                                    </>
                            }
                        </div>
                    </div>
                </div>
                <p>{response && response}</p>
            </div>
        </>

    )
}

export default NftCard