import React from 'react'
import { useRef } from 'react'


function FileRenderer(props) {
    const { mimeType, src } = props;

    switch (mimeType.split('/')[0]) {
        case 'image':
            return <img className=' object-fill h-72 w-96' src={src} alt="Image" />;
        case 'audio':
            return <audio className=' object-fill h-56 w-96' controls><source src={src} type={mimeType} /></audio>;
        case 'video':
            return <video className=' object-fill h-56 w-96' controls><source src={src} type={mimeType} /></video>;
        default:
            return <div>Unsupported file type</div>;
    }
}


function Card(props) {

    const addressField = useRef(null)
    return (
        <div className='flex flex-col items-center justify-center h-fit p-6 max-w-md rounded-lg border-indigo-800 border gap-4 m-7'>
            <p className="font-bold">Name: {props.name}</p>
            <FileRenderer src={props.url} mimeType={props.mimeType}></FileRenderer>

            <div className='flex flex-col items-start gap-2 w-full'>
                <input type="text" className="px-2 py-1 rounded-lg w-full" ref={addressField} placeholder='Recipient address'></input>
                <p className='text-[12px] font-thin opacity-70'>Insert the address that will receive the NFT</p>
            </div>

            <button className="ml-2 mb-2 bg-[#0C93EA]" onClick={() => { props.transfer(props.tokenId, addressField.current.value) }}>Transfer</button>
        </div>
    )
}

export default Card