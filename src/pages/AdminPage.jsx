import { useEffect, useState, useRef } from 'react';
import '../index.css';
//import { DIP721 } from '../declarations/DIP721';
import { idlFactory as storageFactory } from "../lib/storage.did.js"
import { Principal } from '@dfinity/principal';
import EventCard from '../components/EventCard';
import CouponCard from '../components/CouponCard';
import { useConnect, useCanister } from "@connect2ic/react"
import {
    createRoutesFromElements, Link, createBrowserRouter,
    RouterProvider,
    Route
} from "react-router-dom";

async function getUint8Array(file) {
    const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result);
        };
        reader.onerror = function () {
            reject(reader.error);
        };
        reader.readAsArrayBuffer(file);
    });
    const uint8Array = new Uint8Array(arrayBuffer);
    return uint8Array
}


const isSupportedType = (type) => {
    console.log(type)
    const types = ['image', 'audio', 'audio', 'video']
    for (let e of types) {
        if (e === type.split('/')[0])
            return true
    }
    return false;
}

const options = [
    { value: "active", label: "Active" },
    { value: "frozen", label: "Frozen" },
];


function AdminPage(props) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState(null);
    const [cycleAlert, setCycleAlert] = useState(false);
    const [storageCanister, setStorageCanister] = useState(null);
    const [isCustodian, setIsCustodian] = useState(false);
    const [events, setEvents] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [nftCanisterBalance, setNftCanisterBalance] = useState(0);
    const [nftCanisterLedgerBalance, setNftCanisterLedgerBalance] = useState(0);
    const [nftCanisterOustandingBalance, setNftCanisterOustandingBalance] = useState(0);
    const [storageCanisterBalance, setStorageCanisterBalance] = useState(0);
    const [storageCanisterBurn, setStorageCanisterBurn] = useState(0);
    const [storageCanisterMemory, setStorageCanisterMemory] = useState(0);
    const nftNameField = useRef(null)
    const nftDescriptionField = useRef(null)
    const nftUrlField = useRef(null)
    const eventStartField = useRef(null)
    const eventEndField = useRef(null)
    const couponAmountField = useRef(null)
    const couponStartField = useRef(null)
    const couponEndField = useRef(null)
    const [current, setCurrent] = useState("events");
    const [nftCanister] = useCanister("DIP721")
    const { isConnected, principal, activeProvider } = useConnect({
        onConnect: () => {
            // Signed in
            //console.log("onConnect")
        },
        onDisconnect: () => {
            // Signed out
            //console.log("onDisconnect")
            disconnect()
        }
    })

    const disconnect = async () => {
        //clean up state
        setStorageCanister(null)
        setIsCustodian(false)
        setLoading(null)
        setFile(null)
        setCycleAlert(false)
    }

    const createStorageActor = async (id) => {
        const storageCanisterId = id
        console.log(`Storage Canister ID: ${storageCanisterId}`)
        const storageActor = await activeProvider.createActor(storageCanisterId, storageFactory)
        console.log(storageActor)
        console.log(`NFT Canister ID: ${process.env.DIP721_CANISTER_ID}`)
        setStorageCanister(storageActor.value)
        return storageActor.value
    }

    async function fetchId() {
        return new Promise((resolve, reject) => {
            let intervalId = setInterval(async () => {
                const res = await nftCanister.get_storage_canister_id();
                if (res.ok) {
                    clearInterval(intervalId);
                    resolve(res.ok)
                }
            }, 1000);
        });
    }

    const initActors = async () => {
        setCycleAlert(false)
        console.log("Init Actors")
        console.log(principal)
        if (principal === null || principal === undefined) return;
        let isProd = true
        if (process.env.DFX_NETWORK !== "ic") {
            isProd = false;
        }
        let check = await nftCanister.isCustodian();
        if (!check) return;
        setIsCustodian(check)
        console.log("check")
        console.log(check)
        console.log("isProd")
        console.log(isProd)
        const res = await nftCanister.get_storage_canister_id();//gets storage canister id and if it doesnt exist it creates one
        console.log("res")
        console.log(res)
        if (res.ok) {
            return await createStorageActor(res.ok)
        } else if (res.err.nostorageid === null) {
            const res1 = await nftCanister.create_storage_canister(isProd);//gets storage canister id and if it doesnt exist it creates one
            if (res1.ok) {
                return await createStorageActor(res1.ok)
            } else if (res.err.awaitingid === null) {
                fetchId()
                    .then(async id => {
                        console.log(`The valid id is ${id}`);
                        return await createStorageActor(id)
                    })
                    .catch(error => {
                        console.error(`Error fetching the id: ${error}`);
                    });
            } else if (res.err.notenoughcycles === null) {
                setCycleAlert(true)
            }
        } else if (res.err.awaitingid === null) {
            fetchId()
                .then(async (id) => {
                    return await createStorageActor(id)
                })
                .catch(error => {
                    console.error(`Error fetching the id: ${error}`);
                });
        }
    }

    function handleFileUpload(event) {
        const selectedFile = event.target.files[0];
        validateFile(selectedFile);
    }

    function handleDrop(event) {
        handleFileUpload(event)
        setDragging(false);
    }

    function handleDragOver(event) {
        event.preventDefault();
        setDragging(true);
    }

    function handleDragEnter(event) {
        event.preventDefault();
        setDragging(true);
    }

    function handleDragLeave(event) {
        event.preventDefault();
        setDragging(false);
    }

    function validateFile(file) {
        const maxSize = 1024 * 1024 * 30; // 10 MB
        if (file.size > maxSize) {
            setError('File size exceeds 30 MB');
            setFile(null);
        } else {
            setError(null);
            setFile(file);
        }
    }

    const uploadImage = async (storage_actor) => {
        let chunk_ids = [];
        let batch_id = Math.random().toString(36).substring(2, 7);
        let sc = storage_actor
        if (storageCanister !== null) {
            sc = storageCanister
            console.log("storageCanister !== null");
        }
        console.log(sc);
        const uploadChunk = async ({ chunk, order }) => {
            //console.log(storageCanister)
            // console.log(storage)
            console.log("UPLOADING CHUNKS")
            return sc.create_chunk(batch_id, Array.from(chunk), order);
        };
        const asset_unit8Array = await getUint8Array(file)
        console.log(asset_unit8Array)
        const promises = [];
        const chunkSize = 2000000;

        for (
            let start = 0, index = 0;
            start < asset_unit8Array.length;
            start += chunkSize, index++
        ) {
            const chunk = asset_unit8Array.slice(start, start + chunkSize);
            promises.push(
                uploadChunk({
                    chunk,
                    order: index,
                })
            );
        }

        console.log("AWAITING")
        chunk_ids = await Promise.all(promises);


        const asset_filename = file.name;
        const asset_content_type = file.type
        console.log("COMMIT BATCH")
        const { ok: asset_id } = await sc.commit_batch(
            batch_id,
            chunk_ids,
            {
                filename: asset_filename,
                content_encoding: "gzip",
                content_type: asset_content_type,
            }
        );
        if (!asset_id) {
            console.log("Upload failed, not authorized")
            setError("Upload failed, not authorized")
            return null
        }
        //console.log(asset_id);
        console.log("GETTING ID")
        const { ok: asset } = await sc.get(asset_id);
        //console.log(asset);
        //setUploaded(asset.url)
        console.log("RETURNING ASSET")
        return asset;
    }

    const createEventNft = async () => {
        console.log(eventStartField.current.value)
        const startUnixTimestamp = Date.parse(eventStartField.current.value)
        console.log(startUnixTimestamp);
        const endUnixTimestamp = Date.parse(eventEndField.current.value)
        console.log(endUnixTimestamp);
        setError(null)
        if (!nftCanister) {
            console.log("Init error!")
            return
        }

        if (file == null) {
            console.log("No File selected")
            setError("No File selected")
            return
        }

        if (!isSupportedType(file.type)) {
            console.log("Unsupported File Type")
            setError("Unsupported File Type")
            return
        }

        let storage_actor;
        console.log("storageCanister")
        console.log(storageCanister)
        if (storageCanister === null) {
            console.log("storageCanister === null")
            storage_actor = await initActors();
            console.log(storage_actor)
        }

        //upload image
        setLoading(true)
        const onChainFile = await uploadImage(storage_actor)
        if (!onChainFile) return;

        const res = await nftCanister.createEventNft({ transactionId: 0, nftName: nftNameField.current.value, description: nftDescriptionField.current.value, nftUrl: onChainFile.url, nftType: onChainFile.content_type, id: "", state: { active: null }, limit: [], startDate: [], endDate: [], creationDate: 0 })
        console.log(res)
        setLoading(false)
        updateStatus()
    }

    const handleChange = async () => { }
    const changeSelection = (selection) => {
        setCurrent(selection)
    }

    const createCoupon = async () => {
        if (!nftCanister) {
            console.log("Init error!")
            return
        }
        let normalizedAmount = Number(couponAmountField.current.value) * 1_000_000_00 //normalize for 8 decimals
        let res = await nftCanister.createCoupon({ id: "", state: { active: null }, limit: [], startDate: [], endDate: [], redeemer: [], amount: normalizedAmount })
        console.log(res)
        updateStatus()
    }

    const fetchData = async () => {
        if (nftCanister === null || principal === undefined) return
        const events = await nftCanister.getEvents();
        console.log("events")
        console.log(events)
        if (events.ok) {
            setEvents(events.ok);
        }

        const coupons = await nftCanister.getCoupons();
        console.log(coupons)
        if (coupons.ok) {
            setCoupons(coupons.ok);
        }

        updateStatus()
    }

    const updateStatus = async () => {
        let status = await nftCanister.get_status()
        console.log(status)
        setNftCanisterBalance(Number(status.nft_balance))
        setNftCanisterLedgerBalance(Number(status.nft_ledger_balance))
        setNftCanisterOustandingBalance(Number(status.outstanding_balance))
        setNftCanisterBalance(Number(status.nft_balance))
        setStorageCanisterBalance(Number(status.storage_balance))
        setStorageCanisterBurn(Number(status.storage_daily_burn))
        setStorageCanisterMemory(Number(status.storage_memory_used))
    }

    useEffect(() => {
        const init = async () => {
            if (nftCanister === null || principal === undefined) return
            fetchData();
            setIsCustodian(await nftCanister.isCustodian())
            updateStatus()
        }
        init()
        const intervalId = setInterval(async () => {
            fetchData()
        }, 15000);
        return () => clearInterval(intervalId);
    }, [nftCanister, principal]);

    return (
        <>
            {cycleAlert && <p>WARNING: Not enough cycles to spin up storage canister</p>}
            {principal !== undefined && nftCanister !== null && isCustodian &&
                <>
                    <div className='flex flex-row gap-20 justify-center items-center flex-wrap'>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            className={dragging ? 'dragging' : ''}
                        >
                            <div className='flex flex-col items-center justify-center gap-6 max-w-md mx-auto mb-10'>
                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="text" id="nftname" name="nftname" className="px-2 py-1 rounded-lg w-full" ref={nftNameField} placeholder="Event Name" />
                                    <p className='text-[12px] font-thin opacity-70'>Insert the name of your event</p>
                                </div>

                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="text" id="nftname" name="nftname" className="px-2 py-1 rounded-lg w-full" ref={nftDescriptionField} placeholder="Event Name" />
                                    <p className='text-[12px] font-thin opacity-70'>Insert the description of your event</p>
                                </div>

                                <div className="flex flex-col items-start gap-2 w-full">
                                    <input className="w-full" type="file" onChange={handleFileUpload} />
                                    <p className='text-[12px] font-thin opacity-70'>Choose the file to upload</p>
                                </div>
                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="text" id="nftname" name="nftname" className="px-2 py-1 rounded-lg w-full" ref={nftUrlField} placeholder="NFT URL" />
                                    <p className='text-[12px] font-thin opacity-70'>Alternatively insert the image URL</p>
                                </div>
                                <div className="flex flex-row gap-1">
                                    <p className='text-[12px] font-thin opacity-70'>Start Date</p>
                                    <input ref={eventStartField} type="date" id="start" name="event-start"
                                        min="2018-01-01"></input>
                                </div>
                                <div className="flex flex-row gap-1">
                                    <p className='text-[12px] font-thin opacity-70'>End Date</p>
                                    <input ref={eventEndField} type="date" id="start" name="event-end"
                                    ></input>
                                </div>

                                <div className="flex flex-row justify-center items-center w-full">
                                    {/* <button className='bg-[#0C93EA] w-full' onClick={mintNft}>Mint NFT</button> */}
                                    <button className='bg-[#0C93EA] w-full' onClick={createEventNft}>Create Event NFT</button>
                                </div>
                                {error && <p>{error}</p>}
                                {loading && <p>Creating Event NFT...</p>}

                            </div>
                        </div>
                        <div className=' self-start'>
                            <div className='flex flex-col items-top justify-center gap-6 max-w-md mx-auto mb-10'>
                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="number" id="couponamount" name="nftcouponamountname" className="px-2 py-1 rounded-lg w-full" ref={couponAmountField} placeholder="Coupon Amount" />
                                    <p className='text-[12px] font-thin opacity-70'>BTC Coupon Amount</p>
                                </div>
                                <div className="flex flex-row gap-1">
                                    <p className='text-[12px] font-thin opacity-70'>Start Date</p>
                                    <input ref={couponStartField} type="date" id="start" name="event-start"
                                        min="2018-01-01"></input>
                                </div>
                                <div className="flex flex-row gap-1">
                                    <p className='text-[12px] font-thin opacity-70'>End Date</p>
                                    <input ref={couponEndField} type="date" id="start" name="event-end"
                                    ></input>
                                </div>
                                <select className="w-full px-2 py-1 rounded-lg" onChange={handleChange}>
                                    {options.map((option) => (
                                        <option className="text-white w-full" key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-row justify-center items-center w-full">
                                    <button className='bg-[#0C93EA] w-full' onClick={createCoupon}>Create Coupon</button>
                                </div>
                                {error && <p>{error}</p>}
                                {loading && <p>Creating Event NFT...</p>}

                            </div>
                        </div>
                        <div className='flex flex-col gap-2  self-start text-left'>
                            <h2 className="text-center">Status</h2>
                            <p>NFT Canister Cycles: {nftCanisterBalance}</p>
                            <p>Storage Canister Cycles: {storageCanisterBalance}</p>
                            <p>Storage Daily Cycle Burn: {storageCanisterBurn}</p>
                            <p>Storage Memory Usage: {storageCanisterMemory} Bytes</p>
                            <p>Estimated lifetime: {nftCanisterBalance / storageCanisterBurn} days left</p>
                            <p>Canister ckBTC balance: {nftCanisterLedgerBalance} ckSats</p>
                            <p>Canister outstanding balance: {nftCanisterOustandingBalance} ckSats</p>
                        </div>
                    </div>
                    <div className="flex flex-row gap-4 ml-[4.3rem] mt-10  mb-10">
                        <button onClick={() => changeSelection("events")}>Events</button>
                        <button onClick={() => changeSelection("coupons")}>Coupons</button>
                    </div>
                    {
                        current === "events" ?
                            <>
                                <h2 className=" mb-10">Events</h2>
                                {
                                    events.length > 0 ? (
                                        <div className="flex flex-row flex-wrap px-10">
                                            {
                                                events.map((e, i) => {
                                                    return (
                                                        <>
                                                            <EventCard id={e.id} mimeType={e.nftType} key={e.id} name={e.nftName} url={e.nftUrl} state={e.state}></EventCard>
                                                        </>
                                                    )
                                                })
                                            }
                                        </div>) : (<div className="flex justify-center items-center" >You haven't created any events</div>)
                                }
                            </>
                            :
                            <>
                                <h2>Coupons</h2>
                                {
                                    coupons.length > 0 ? (
                                        <div className="flex flex-row flex-wrap px-10">
                                            {
                                                coupons.map((e, i) => {
                                                    return (
                                                        <>
                                                            <CouponCard id={e.id} amount={Number(e.amount)} key={e.id} state={e.state}></CouponCard>
                                                        </>
                                                    )
                                                })
                                            }
                                        </div>) : (<div className="flex justify-center items-center" >You haven't created any coupons</div>)
                                }
                            </>
                    }
                </>
            }

            {
                principal === undefined && <>
                    <p>Login to interact...</p>
                </>
            }
        </>
    );
}


export default AdminPage