# ICTdays-workshop-NFT
Public repo for the boilerplate code used in the ICTdays ICP presentation


## How to Install and run locally
- install dfx
- dfx start --clean --emulator
- update admin in .mo files (search TODO to find them easily)
- npm run setup
- npm run start

## dfx commands to deploy on mainnet
- dfx wallet --network ic balance //Check if you have enough cycles
- dfx canister --network ic create DIP721 --with-cycles 2000000000000 //Required only once
- dfx canister --network ic create frontend --with-cycles 1000000000000 //Required only once
- dfx build --network ic DIP721
- dfx build --network ic frontend
- dfx canister --network ic install DIP721
- dfx canister --network ic install frontend
- dfx canister --network ic deposit-cycles 1000000000000 canister_name //In case you need to top up a canister