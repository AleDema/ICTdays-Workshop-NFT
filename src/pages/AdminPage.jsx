import { useEffect, useState, useRef } from 'react';
import '../index.css';
import motokoLogo from '../assets/motoko_moving.png';
import motokoShadowLogo from '../assets/motoko_shadow.png';
import { DIP721 } from '../declarations/DIP721';
import { idlFactory as storageFactory } from "../lib/storage.did.js"
import { Principal } from '@dfinity/principal';
import Card from '../components/Card';
import EventCard from '../components/EventCard';
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect, useCanister } from "@connect2ic/react"
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

function AdminPage(props) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState(null);
    const [cycleAlert, setCycleAlert] = useState(false);
    const [storageCanister, setStorageCanister] = useState(null);
    const [isCustodian, setIsCustodian] = useState(false);
    const [events, setEvents] = useState([]);
    const [nftCanisterBalance, setNftCanisterBalance] = useState(0);
    const [storageCanisterBalance, setStorageCanisterBalance] = useState(0);
    const [storageCanisterBurn, setStorageCanisterBurn] = useState(0);
    const [storageCanisterMemory, setStorageCanisterMemory] = useState(0);
    const nftNameField = useRef(null)
    const nftUrlField = useRef(null)
    const eventStartField = useRef(null)
    const eventEndField = useRef(null)
    const [nftCanister] = useCanister("DIP721")
    const { isConnected, principal, activeProvider } = useConnect({
        onConnect: () => {
            // Signed in
            console.log("onConnect")
        },
        onDisconnect: () => {
            // Signed out
            console.log("onDisconnect")
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
        //console.log(nftActor)
        console.log(`NFT Canister ID: ${process.env.DIP721_CANISTER_ID}`)
        setStorageCanister(storageActor.value)
    }

    async function fetchId() {
        return new Promise((resolve, reject) => {
            let intervalId = setInterval(async () => {
                const res = await DIP721.get_storage_canister_id();
                if (res.ok) {
                    clearInterval(intervalId);
                    resolve(res.ok)
                }
            }, 500);
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
        const res = await DIP721.get_storage_canister_id();//gets storage canister id and if it doesnt exist it creates one
        if (res.ok) {
            createStorageActor(res.ok)
            //setNftCanister(nftActor)
        } else if (res.err.nostorageid === null) {
            const res1 = await DIP721.create_storage_canister(isProd);//gets storage canister id and if it doesnt exist it creates one
            if (res1.ok) {
                createStorageActor(res1.ok)
                //setNftCanister(nftActor)
            } else if (res.err.awaitingid === null) {
                fetchId()
                    .then(id => {
                        console.log(`The valid id is ${id}`);
                        createStorageActor(id)
                        //setNftCanister(nftActor)
                    })
                    .catch(error => {
                        console.error(`Error fetching the id: ${error}`);
                    });
            } else if (res.err.notenoughcycles === null) {
                setCycleAlert(true)
            }
        } else if (res.err.awaitingid === null) {
            fetchId()
                .then(id => {
                    createStorageActor(id)
                    //setNftCanister(nftActor)
                })
                .catch(error => {
                    console.error(`Error fetching the id: ${error}`);
                });
        }
    }

    function handleFileUpload(event) {
        const selectedFile = event.target.files[0];
        // console.log(selectedFile)
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
        const maxSize = 1024 * 1024 * 10; // 10 MB
        if (file.size > maxSize) {
            setError('File size exceeds 10 MB');
            setFile(null);
        } else {
            setError(null);
            setFile(file);
        }
    }

    const uploadImage = async () => {
        let chunk_ids = [];
        let batch_id = Math.random().toString(36).substring(2, 7);

        const uploadChunk = async ({ chunk, order }) => {
            //console.log(storageCanister)
            // console.log(storage)
            console.log("UPLOADING CHUNKS")
            return storageCanister.create_chunk(batch_id, Array.from(chunk), order);
        };
        const asset_unit8Array = await getUint8Array(file)
        //console.log(asset_unit8Array)
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

        chunk_ids = await Promise.all(promises);


        const asset_filename = file.name;
        const asset_content_type = file.type
        console.log("COMMIT BATCH")
        const { ok: asset_id } = await storageCanister.commit_batch(
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
        const { ok: asset } = await storageCanister.get(asset_id);
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
        //upload image
        setLoading(true)
        const onChainFile = await uploadImage()
        if (!onChainFile) return;

        nftCanister.createEventNft({ nftName: nftNameField.current.value, nftUrl: onChainFile.url, nftType: onChainFile.content_type, id: "", limit: [], startDate: [], endDate: [] })
        setLoading(false)
    }

    const mintNft = async () => {
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
        //upload image
        setLoading(true)
        const onChainFile = await uploadImage()
        if (!onChainFile) return;
        //mint nft
        let metadata = {
            purpose: {
                Rendered: null
            },
            key_val_data: [
                {
                    key: "name",
                    val: {
                        TextContent: nftNameField.current.value || "Hello ICTdays"
                    }
                },
                {
                    key: "contentType",
                    val: {
                        TextContent: onChainFile.content_type
                    }
                },
                {
                    key: "locationType",
                    val: {
                        TextContent: "url"
                    }
                },
                {
                    key: "location",
                    val: {
                        TextContent: onChainFile.url
                    }
                },

            ],
            data: []
        }
        let p = Principal.fromText(principal)
        //console.log(await nftCanister.getMetadataDip721(receipt.Ok.token_id))
        let receipt = await nftCanister.mintDip721(p, [metadata])
        console.log("receipt")
        console.log(receipt)
        //if minting fails, delete uploaded image
        if (receipt.Err) {
            const res = await storageCanister.delete_asset(onChainFile.id)
            console.log(res)
            setError(receipt.Err)
        }

        if (receipt.Ok) {
            console.log("succesful mint")
            console.log(receipt.Ok)
            console.log(receipt.Ok.token_id)
            let newNft = await nftCanister.getMetadataDip721(receipt.Ok.token_id)
            console.log(newNft)
            setNfts((oldNfts) => {
                newNft.Ok.token_id = receipt.Ok.token_id
                return [newNft.Ok, ...oldNfts]
            })
        }
        setLoading(false)
    }

    const fetchData = async () => {
        // console.log(`principal ${principal}`)
        // console.log("nftCanister")
        // console.log(nftCanister)
        if (nftCanister === null || principal === undefined) return
        const events = await nftCanister.getEvents();
        console.log(events)
        if (events.ok) {
            setEvents(events.ok);
        }
    }

    useEffect(() => {
        const init = async () => {
            fetchData();
            let status = await nftCanister.get_status()
            console.log(status)
            setNftCanisterBalance(Number(status.nft_balance))
            setStorageCanisterBalance(Number(status.storage_balance))
            setStorageCanisterBurn(Number(status.storage_daily_burn))
            setStorageCanisterMemory(Number(status.storage_memory_used))
        }
        init()
        const intervalId = setInterval(async () => {
            fetchData()
        }, 15000);
        return () => clearInterval(intervalId);
    }, [nftCanister, principal]);

    useEffect(() => {
        console.log("principal changed")
        console.log(principal)
        initActors()
    }, [principal]);

    return (
        <div className="bg-gray-900 w-screen h-[90vh] flex flex-col overflow-auto ">
            <div className="flex flex-row">
                <div className="self-start p-8 font-bold">
                    <h1>Blockchain Week Minter</h1>
                </div>
                <div className="self-end p-8 ml-auto">
                    <ConnectButton />
                    <ConnectDialog />
                </div>
            </div>
            <div className="flex flex-row justify-center items-center">
                <a
                    href="https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/"
                    target="_blank"
                >
                    <span className="logo-stack">
                        <img
                            src={motokoShadowLogo}
                            className="logo motoko-shadow"
                            alt="Motoko logo"
                        />
                        <img src={motokoLogo} className="logo motoko" alt="Motoko logo" />
                    </span>
                </a>
            </div>
            {cycleAlert && <p>WARNING: Not enough cycles to spin up storage canister</p>}
            {principal !== undefined && nftCanister !== null && isCustodian &&
                <>
                    <div className='flex flex-row gap-20 justify-center items-center'>
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
                        <div>
                            <div className='flex flex-col items-center justify-center gap-6 max-w-md mx-auto mb-10'>
                                <div className='flex flex-col items-start gap-2 w-full'>
                                    <input type="number" id="couponamount" name="nftcouponamountname" className="px-2 py-1 rounded-lg w-full" ref={nftNameField} placeholder="Coupon Amount" />
                                    <p className='text-[12px] font-thin opacity-70'>Coupon Amount</p>
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
                                    <button className='bg-[#0C93EA] w-full' onClick={createEventNft}>Create Coupon</button>
                                </div>
                                {error && <p>{error}</p>}
                                {loading && <p>Creating Event NFT...</p>}

                            </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h2>Status</h2>
                            <p>nftCanisterBalance: {nftCanisterBalance}</p>
                            <p>storageCanisterBalance: {storageCanisterBalance}</p>
                            <p>storageCanisterBurn: {storageCanisterBurn}</p>
                            <p>storageCanisterMemory: {storageCanisterMemory}</p>
                        </div>
                    </div>
                    <h2>Events</h2>
                    {
                        events.length > 0 ? (
                            <div className="flex flex-row flex-wrap px-10">
                                {
                                    events.map((e, i) => {
                                        return (
                                            <>
                                                <EventCard id={e.id} mimeType={e.nftType} key={e.id} name={e.nftName} url={e.nftUrl}></EventCard>
                                            </>
                                        )
                                    })
                                }
                            </div>) : (<div className="flex justify-center items-center" >You haven't created any events</div>)
                    }
                </>
            }

            {
                principal === undefined && <>
                    <p>Login to interact...</p>
                </>
            }

            {
                isCustodian && storageCanister === null && principal && <>
                    <p>Retrieving Data...</p>
                </>
            }
        </div >
    );
}


export default AdminPage