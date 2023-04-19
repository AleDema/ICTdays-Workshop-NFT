import { useEffect, useState, useRef } from 'react';
import './index.css';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import { DIP721 } from './declarations/DIP721';
import { idlFactory as nftFactory } from './declarations/DIP721';
import { idlFactory as storageFactory } from "./lib/storage.did.js"
import { Principal } from '@dfinity/principal';
import Card from './components/Card';


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

function App() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [cycleAlert, setCycleAlert] = useState(false);
  const [nftCanister, setNftCanister] = useState(null);
  const [storageCanister, setStorageCanister] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [nfts, setNfts] = useState([]);
  const nftNameField = useRef(null)

  const verifyConnection = async () => {
    const connected = await window.ic.plug.isConnected();
    if (connected) {
      disconnect()
    };
    // Whitelist
    const whitelist = [
      process.env.DIP721_CANISTER_ID,
    ];

    let host = "https://mainnet.dfinity.network"
    if (process.env.DFX_NETWORK !== "ic") {
      host = "http://127.0.0.1:4943";

    }
    console.log(`Network: ${host}`)
    console.log(process.env.DIP721_CANISTER_ID)
    // Callback to print sessionData
    const onConnectionUpdate = async () => {
      console.log("onConnectionUpdate")
      disconnect()
      // console.log(window.ic.plug.sessionManager.sessionData)
      // let principal = await window.ic.plug.getPrincipal()
      // setPrincipal(principal)
      //initActors()
    }
    // Make the request
    try {
      const publicKey = await window.ic.plug.requestConnect({
        whitelist,
        host,
        onConnectionUpdate,
        timeout: 50000
      });

      console.log(`The connected user's public key is:`, publicKey);
    } catch (e) {
      console.log(e);
    }
    let principal = await window.ic.plug.getPrincipal()
    setPrincipal(principal)
    //initActors()
  };


  const connect = () => {
    verifyConnection()
  }

  const disconnect = async () => {
    //clean up state
    setPrincipal(null)
    setNftCanister(null)
    setStorageCanister(null)
    setLoading(null)
    setFile(null)
    setCycleAlert(false)
    setNfts([])
    window.ic.plug.sessionManager.disconnect()

  }

  const initActors = async () => {
    setCycleAlert(false)
    console.log("Init Actors")
    if (principal === null) return;
    let isProd = true
    if (process.env.DFX_NETWORK !== "ic") {
      isProd = false;
    }

    const nftCanisterId = process.env.DIP721_CANISTER_ID
    const nftActor = await window.ic.plug.createActor({
      canisterId: nftCanisterId,
      interfaceFactory: nftFactory,
    });
    //Check in a loop in case the storage canister has been initialized by someone else but still hasn't resolved the id
    let intervalId = setInterval(async function () {
      const res = await DIP721.get_storage_canister_id(isProd);//gets storage canister id and if it doesnt exist it creates one
      if (res.ok) {
        clearInterval(intervalId)
        const storageCanisterId = res.ok
        console.log(`Storage Canister ID: ${storageCanisterId}`)
        const storageActor = await window.ic.plug.createActor({
          canisterId: storageCanisterId,
          interfaceFactory: storageFactory,
        });
        //console.log(nftActor)
        console.log(`NFT Canister ID: ${process.env.DIP721_CANISTER_ID}`)
        setStorageCanister(storageActor)
        setNftCanister(nftActor)
      } else {
        //set error if canister doesnt have enough cycles to spin up storage canister, in such cases you should top it up.
        if (res.err.notenoughcycles === null) {
          clearInterval(intervalId)
          setCycleAlert(true)
        }
      }
    }, 6000);
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
      // console.log(storageCanister)
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

  const transferNft = async (id, address) => {
    console.log(`Transfer to: ${address} NFT with id: ${id}`)
    let receipt = await nftCanister.transferFromDip721(principal, Principal.fromText(address), id)
    if (!receipt.Ok) return;
    setNfts((oldNfts) => {
      return oldNfts.filter((item, i) => item.token_id !== id);
    })
  }

  const mintNft = async () => {
    setError(null)
    if (!nftCanister) {
      console.log("init error!")
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
    let p = Principal.fromUint8Array(principal._arr)
    //console.log(await nftCanister.getMetadataDip721(receipt.Ok.token_id))
    // await window.ic.plug.agent.fetchRootKey()
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
    if (nftCanister === null || !principal === null) return
    const ids = await nftCanister.getTokenIdsForUserDip721(principal)
    const newNfts = await Promise.all(ids.map(async (item) => {
      let value = await nftCanister.getMetadataDip721(item)
      value.Ok.token_id = item
      return value.Ok
    }))
    console.log("NFTs:")
    console.log(newNfts)
    setNfts(newNfts)
  }

  useEffect(() => {
    const init = async () => {
      fetchData();
    }
    init()
    const intervalId = setInterval(async () => {
      fetchData()
    }, 15000);
    return () => clearInterval(intervalId);
  }, [nftCanister, principal]);

  useEffect(() => {
    initActors()
  }, [principal]);

  return (
    <div className="bg-gray-900 w-screen h-screen flex flex-col overflow-auto ">
      <div className="flex flex-row">
        <div className="self-start p-8 font-bold">
          <h1>UniTN Minter</h1>
        </div>
        <div className="self-end p-8 ml-auto">
          {principal && <button onClick={disconnect}>Disconnect</button>}
          {!principal && <button onClick={connect}>Connect Plug</button>}
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
      {nftCanister &&
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={ dragging ? 'dragging' : ''}
          >
            <div className='flex flex-col items-center justify-center gap-6 max-w-md mx-auto mb-10'>
              <div className='flex flex-col items-start gap-2 w-full'>
                <input type="text" id="nftname" name="nftname" className="px-2 py-1 rounded-lg w-full" ref={nftNameField} placeholder="NFT Name" />
                <p className='text-[12px] font-thin opacity-70'>Insert the name of your NFT</p>
              </div>

              <div className="flex flex-col items-start gap-2 w-full">
                <input className="w-full" type="file" onChange={handleFileUpload} />
                <p className='text-[12px] font-thin opacity-70'>Choose the file to upload</p>
              </div>

              <div className="flex flex-row justify-center items-center w-full">
                <button className='bg-[#0C93EA] w-full' onClick={mintNft}>Mint NFT</button>
              </div>
              {error && <p>{error}</p>}
              {loading && <p>Minting NFT...</p>}

            </div>
              
            {
              nfts.length > 0 ? (
                <div className="flex flex-row flex-wrap px-10">
                  {
                    nfts.map((e, i) => {
                      let name, url, mimeType;
                      //console.log(e)
                      e[0].key_val_data.forEach((item, index) => {
                        if (item.key == "name") name = item.val.TextContent;
                        else if (item.key == "location") url = item.val.TextContent;
                        else if (item.key == "contentType") mimeType = item.val.TextContent;
                      })
                      return (
                        <Card tokenId={e.token_id} mimeType={mimeType} key={url} name={name} url={url} transfer={transferNft}></Card>
                      )
                    })
                  }
                </div>) : (<div className="flex justify-center items-center" >You don't have any NFTs</div>)
            }  
          </div>
        </>
      }

      {
        !principal && <>
          <p>Login to interact...</p>
        </>
      }

      {
        storageCanister === null && principal && <>
          <p>Retrieving Data...</p>
        </>
      }
    </div >
  );
}

export default App;