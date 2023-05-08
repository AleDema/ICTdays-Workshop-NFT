import React from 'react'
import '../index.scss';
import { useCanister } from "@connect2ic/react"
import { useRef } from 'react'

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
    return (
        <div className=" min-w-[284px] min-h-[475px]">
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
                                <a href="#" className="btn btn-cart btn-outline" onClick={props.claimNft}>
                                    <span>
                                        Claim NFT
                                    </span>
                                </a>
                            </>
                            :
                            <>
                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="text" className="px-2 py-1 rounded-lg w-full" placeholder='Recipient address' ref={addressField}></input>
                                    <p className='text-[12px] font-thin opacity-70'>Insert the address that will receive the NFT</p>
                                </div>
                                <a href="#" class="btn btn-cart btn-outline" onClick={() => { props.transfer(props.tokenId, addressField.current.value) }}>
                                    <span>
                                        Transfer
                                    </span>
                                </a>
                            </>
                    }
                </div>
            </div>
        </div>

    )
}

export default NftCard