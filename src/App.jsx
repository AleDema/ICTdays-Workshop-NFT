import { useEffect, useState, useRef } from 'react';
import './index.css';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/react.svg';
// import { backend } from './declarations/backend';
import { storage } from './declarations/storage';
import { DIP721 } from './declarations/DIP721';
import { idlFactory as nftFactory } from './declarations/DIP721';
import { idlFactory as storageFactory } from './declarations/storage';
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
  console.log('Uint8Array:', uint8Array);
  return uint8Array
}

function App() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [nftCanister, setNftCanister] = useState(null);
  const [storageCanister, setStorageCanister] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [nfts, setNfts] = useState([]);

  function handleFileUpload(event) {
    const selectedFile = event.target.files[0];
    console.log(selectedFile)
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
      return storage.create_chunk(batch_id, chunk, order);
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
      //console.log(chunk)
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
      return null
    }
    console.log(asset_id);
    const { ok: asset } = await storage.get(asset_id);
    console.log(asset);
    setUploaded(asset.url)
    return asset;
  }

  const mintNft = async () => {
    if (!nftCanister) {
      console.log("init error!")
      return
    }

    if (!file) {
      console.log("No File selected")
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
            TextContent: "Hello ICTdays"
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
    // let arr = arr.push(metadata)
    let p = Principal.fromUint8Array(principal._arr)
    let receipt = await nftCanister.mintDip721(p, [metadata])
    console.log(receipt)
    //if minting fails, delete uploaded image
    if (receipt.Err) {
      const res = await storageCanister.delete_asset(onChainFile.id)
      console.log(res)
    }

    if (receipt.Ok) {
      console.log("succesful mint")
    }
    setLoading(false)
  }

  const verifyConnection = async () => {
    const connected = await window.ic.plug.isConnected();
    // console.log(connected);
    // console.log(process.env.DIP721_CANISTER_ID);
    if (!connected) {

      // Whitelist
      const whitelist = [
        process.env.DIP721_CANISTER_ID,
        process.env.STORAGE_CANISTER_ID
      ];

      // Host TODO switch for mainnet
      const host = "http://127.0.0.1:4943"//process.env.DFX_NETWORK;

      // Callback to print sessionData
      const onConnectionUpdate = async () => {
        console.log(window.ic.plug.sessionManager.sessionData)
        let principal = await window.ic.plug.getPrincipal()
        setPrincipal(Principal.fromUint8Array(principal._arr))

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
    }
    let principal = await window.ic.plug.getPrincipal()
    setPrincipal(principal)
  };

  const initActors = async () => {
    console.log("initActors")
    console.log(principal)

    if (!principal) return;
    const nftCanisterId = process.env.DIP721_CANISTER_ID
    const nftActor = await window.ic.plug.createActor({
      canisterId: nftCanisterId,
      interfaceFactory: nftFactory,
    });
    setNftCanister(nftActor)

    const storageCanisterId = process.env.STORAGE_CANISTER_ID
    const storageActor = await window.ic.plug.createActor({
      canisterId: storageCanisterId,
      interfaceFactory: storageFactory,
    });

    setStorageCanister(storageActor)
  }


  const connect = () => {
    verifyConnection()
  }

  const disconnect = async () => {
    window.ic.plug.sessionManager.disconnect()

    setPrincipal(null)
    //clean all state
  }

  const fetchData = async () => {

    console.log(`principal ${principal}`)
    if (!nftCanister || !principal) return
    const ids = await nftCanister.getTokenIdsForUserDip721(principal)
    const nfts = []
    ids.forEach(async function (item, index) {
      console.log(item, index);
      let value = await nftCanister.getMetadataDip721(item)
      nfts.push(value.Ok)
      setNfts(nfts)
      console.log(`value ${value}`)
    });
  }

  useEffect(() => {
    initActors()
  }, [principal]);

  useEffect(() => {
    async function loadData() {
      await fetchData();
    }
    //console.log(`nftCanister ${nftCanister}`)
    loadData();
  }, [nftCanister, principal]);

  return (
    <div className="bg-gray-900 w-screen h-screen flex flex-col  ">
      <div className="self-end p-8 ">
        {principal && <button onClick={disconnect}>Disconnect</button>}
        {!principal && <button onClick={connect}>Connect</button>}
      </div>
      <div className="flex flex-row justify-center items-center">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite " alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
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
      {principal && <>
        <div className="flex flex-row justify-center items-center">
          {/* <button className=' m-4' onClick={uploadImage}>Test upload</button> */}
          <button onClick={mintNft}>Mint NFT</button>
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={dragging ? 'dragging' : ''}
        >
          <input type="file" onChange={handleFileUpload} />
          {error && <p>{error}</p>}
          {file && <p>Selected file: {file.name}</p>}
          {loading && <p>Minting NFT...</p>}
          <div className="flex flex-row">
            {nfts.map((e, i) => {
              let name, url;
              console.log(e)
              e[0].key_val_data.forEach((item, index) => {
                if (item.key == "name") name = item.val.TextContent;
                if (item.key == "location") url = item.val.TextContent;

              })
              return (
                <Card name={name} url={url}></Card>
              )
            })}
          </div>
        </div>
      </>
      }

      {!principal && <>
        <p>Login to interact...</p>
      </>}
    </div>
  );
}

export default App;