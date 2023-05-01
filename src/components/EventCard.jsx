import React from 'react'
import { Link } from "react-router-dom";
import { useCanister } from "@connect2ic/react"

const options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

const copyToClipboard = async (path) => {
    const { origin, pathname } = window.location;
    try {
        await navigator.clipboard.writeText(`${origin}${path}`);
        console.log(`${origin}${path}`)
        console.log('Text copied to clipboard');
    } catch (error) {
        console.error('Failed to copy text: ', error);
    }
};

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

    const [nftCanister] = useCanister("DIP721")
    const [newState, setNewState] = React.useState({ active: null })
    const handleChange = async (value) => {
        console.log(value)
        if (value === "active") {
            setNewState({ active: null })
        } else if (value === "inactive") {
            setNewState({ inactive: null })
        }
    }
    const updateEvent = async () => {
        const res = await nftCanister.updateEventState(props.id, newState);
        console.log(res)
    }

    console.log(props)
    let state = "Active"
    if (props.state?.inactive === null) {
        state = "Inactive"
    }

    return (
        <div className='flex flex-col items-center justify-center h-fit p-6 max-w-md rounded-l border-sky-600 border gap-4 m-7'>
            <p className="font-bold">Name: {props.name}</p>
            <p className="font-bold">Status: {state}</p>
            <FileRenderer src={props.url} mimeType={props.mimeType}></FileRenderer>
            {
                props.isClaim ?
                    <>
                        <button className='bg-[#0C93EA] w-full' onClick={props.claimNft}>Claim NFT</button>
                    </>
                    :
                    <>
                        <div>
                            <select className="w-full px-2 py-1 rounded-lg" onChange={(e) => handleChange(e.target.value)}>
                                {options.map((option) => (
                                    <option className="text-white w-full" key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button className="ml-2 mb-2 bg-[#0C93EA]" onClick={updateEvent}>Update</button>
                        </div>
                        <Link to={`/claimnft/${props.id}`} key={props.id}>
                            <button className="ml-2 mb-2 bg-[#0C93EA]">Go to page</button>
                        </Link>
                        <button className="ml-2 mb-2 bg-[#0C93EA]" onClick={() => copyToClipboard(`/claimnft/${props.id}`)}>Copy Link</button>
                    </>
            }
        </div>
    )
}

export default EventCard