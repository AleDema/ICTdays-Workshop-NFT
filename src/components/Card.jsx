import React from 'react'
import { useRef } from 'react'


function FileRenderer(props) {
    const { mimeType, src } = props;

    switch (mimeType.split('/')[0]) {
        case 'image':
            return <img className=' object-fill h-56 ' src={src} alt="Image" />;
        case 'audio':
            return <audio className=' object-fill h-56 ' controls><source src={src} type={mimeType} /></audio>;
        case 'video':
            return <video className=' object-fill h-56 ' controls><source src={src} type={mimeType} /></video>;
        default:
            return <div>Unsupported file type</div>;
    }
}


function Card(props) {

    const addressField = useRef(null)
    return (
        <div className=' w-52 h-fit m-10 rounded-md border-indigo-800 border p-1'>
            <p>{props.name}</p>
            <FileRenderer src={props.url} mimeType={props.mimeType}></FileRenderer>
            <input type="text" ref={addressField} placeholder='Address'></input>
            <button onClick={() => { props.transfer(props.tokenId, addressField.current.value) }}>Transfer</button>
        </div>
    )
}

export default Card