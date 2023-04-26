import React from 'react'
import { Link } from "react-router-dom";

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


function EventCard(props) {
    console.log(props.id)
    return (
        <div className='flex flex-col items-center justify-center h-fit p-6 max-w-md rounded-l border-sky-600 border gap-4 m-7'>
            <p className="font-bold">{props.name}</p>
            <FileRenderer src={props.url} mimeType={props.mimeType}></FileRenderer>
            <Link to={`/claimnft/${props.id}`} key={props.id}>
                <button className="ml-2 mb-2 bg-[#0C93EA]">Go to page</button>
            </Link>
        </div>
    )
}

export default EventCard