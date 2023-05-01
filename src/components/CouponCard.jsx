import React from 'react'
import { Link } from "react-router-dom";
import ckLogo from '../assets/ckbtc.webp';
import { useCanister } from "@connect2ic/react"

const options = [
    { value: "active", label: "Active" },
    { value: "frozen", label: "Frozen" },
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

function CouponCard(props) {

    const [nftCanister] = useCanister("DIP721")
    const [newState, setNewState] = React.useState({ active: null })
    const handleChange = async (value) => {
        console.log(value)
        if (value === "active") {
            setNewState({ active: null })
        } else if (value === "frozen") {
            setNewState({ frozen: null })
        }
    }
    const deleteCoupon = async () => {
        nftCanister.deleteCoupon(props.id);
    }
    const updateCoupon = async () => {
        const res = await nftCanister.updateCouponState(props.id, newState);
        console.log(res)
    }


    console.log(props)
    let state = "Active"
    let button = <button className='bg-[#0C93EA] w-full' onClick={props.redeemCoupon}>Redeem Coupon</button>
    if (props.state.frozen === null) {
        state = "Frozen"
        button = <button className='bg-[#5a0cea] w-full'>Coupon isn't active</button>
    } else if (props.state.redeemed === null) {
        state = "Redeemed"
        button = <button className='bg-[#ea610c] w-full'>Coupon has been redeemed</button>
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className='flex flex-col  justify-center h-fit p-6 max-w-md rounded-l border-orange-500 border gap-4 m-7 text-left'>
                < p className="font-bold" > ckBTC Coupon</p >
                <p className="font-bold">Amount: {Number(props.amount)} ckSats</p>
                <p className="font-bold">State: {state}</p>
                <p className="font-bold">ID: {props.id}</p>
                <img className=' object-fill h-72 w-96' src={ckLogo} alt="Image" />
                {
                    props.isClaim ?
                        <>
                            {button}
                        </>
                        :
                        <>
                            {
                                state !== "Redeemed" ?
                                    <div>
                                        <select className="w-full px-2 py-1 rounded-lg" onChange={(e) => handleChange(e.target.value)}>
                                            {options.map((option) => (
                                                <option className="text-white w-full" key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button className="ml-2 mb-2 bg-[#0C93EA]" onClick={updateCoupon}>Update</button>
                                        <button className="ml-2 mb-2 bg-[#ea470c]" onClick={deleteCoupon}>Delete</button>
                                    </div>
                                    :
                                    <></>
                            }
                            <Link to={`/redeemcoupon/${props.id}`} key={props.id} >
                                <button className="ml-2 mb-2 bg-[#0C93EA]">Go to page</button>
                            </Link>
                            <button className="ml-2 mb-2 bg-[#0C93EA]" onClick={() => copyToClipboard(`/redeemcoupon/${props.id}`)}>Copy Link</button>
                        </>
                }
            </div >
        </div >
    )
}

export default CouponCard