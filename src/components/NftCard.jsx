import React from 'react'
import '../index.scss';
import { useCanister, useConnect, useWallet } from "@connect2ic/react"
import { useRef } from 'react'
import { Principal } from '@dfinity/principal';
import { useNavigate } from 'react-router-dom';

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

    const [walletProvider] = useWallet()
    const [nftCanister] = useCanister("DIP721")
    const addressField = useRef(null)
    const [loading, setLoading] = React.useState(false)
    const [transferingWallet, setTransferingWallet] = React.useState(false)
    const [response, setResponse] = React.useState()
    const [result, setResult] = React.useState("none")
    const [resultText, setResultText] = React.useState()
    const { isConnected, principal, activeProvider } = useConnect()
    const navigate = useNavigate();

    const claimNft = async () => {
        setResult("none")
        setLoading(true)
        let res
        if (walletProvider?.meta?.name === "ICX") {
            res = await nftCanister.claimEventNftToAddress(props.id, Principal.fromText(walletProvider?.wallets[0].principal))
        }
        else {
            res = await nftCanister.claimEventNft(props.id)
            //res = await nftCanister.claimEventNftToAddress(props.id, Principal.fromText(principal))
        }

        setLoading(false)
        console.log(res)
        //props.setResponse(res.ok || res.err)
        if (res.ok) {
            setResult("success")
        } else if (res.err) {
            setResult("error")
            setResultText(res.err)
        }

        if (walletProvider?.meta?.name !== "ICX") {
            const timeout = setTimeout(() => {
                navigate('/');
            }, 2000)
        }
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
            setTimeout(() => {
                setResponse()
            }, 5000)
            console.log(e)
        }
        setLoading(false)
        if (!receipt?.Ok) return;
        props.setNfts((oldNfts) => {
            return oldNfts.filter((item, i) => item.token_id !== props.tokenId);
        })
    }

    const transferNftToWallet = async () => {
        setResponse()
        setTransferingWallet(true)
        console.log(`Transfer to: ${addressField?.current?.value} NFT with id: ${props.tokenId}`)
        let receipt
        try {
            receipt = await nftCanister.transferFromDip721(Principal.fromText(principal), Principal.fromText(walletProvider?.wallets[0].principal), props.tokenId)
        } catch (e) {
            setResponse("Invalid Address!")
            setTimeout(() => {
                setResponse()
            }, 5000)
            console.log(e)
        }
        setTransferingWallet(false)
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
                                    <>
                                        <h2>{props.name}</h2>
                                        <p className='description'>#{props.nftId}</p>
                                    </>

                            }
                            <hr className="mb-5" />
                            <div className='tokenInfo'>
                            </div>
                            <p className='text-red-600 transition-opacity duration-100 animate-pulse '>{response}</p>
                            {
                                props.isClaim ?
                                    <>
                                        <a href="#" className="btn btn-cart btn-outline" onClick={claimNft}>
                                            {loading ?
                                                <span>
                                                    Loading...
                                                </span>
                                                :
                                                <>
                                                    {result === "success" && walletProvider?.meta?.name !== "ICX" &&
                                                        <span>
                                                            Success!
                                                        </span>
                                                    }

                                                    {result === "success" && walletProvider?.meta?.name === "ICX" &&
                                                        <span>
                                                            Success! Check Your Wallet.
                                                        </span>
                                                    }

                                                    {result === "none" &&
                                                        <span>
                                                            Claim NFT
                                                        </span>
                                                    }

                                                    {result === "error" &&
                                                        <span>
                                                            {resultText}
                                                        </span>
                                                    }
                                                </>

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
                                                    Transfering...
                                                </span>
                                                :
                                                <span>
                                                    Transfer
                                                </span>
                                            }
                                        </a>
                                        {
                                            walletProvider?.meta?.name === "ICX" &&
                                            <a href="#" className="btn btn-cart btn-outline mt-3" onClick={transferNftToWallet}>
                                                {
                                                    transferingWallet ?
                                                        <span>
                                                            Transfering...
                                                        </span>
                                                        :
                                                        <span>
                                                            Transfer To Wallet
                                                        </span>
                                                }
                                            </a>
                                        }
                                    </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>

    )
}

export default NftCard