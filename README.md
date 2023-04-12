# ICTdays-workshop-NFT
Public repo for the boilerplate code used in the ICTdays ICP presentation


## How to Install
- install dfx
- dfx start --clean --emulator
- update admin and canister principal in .mo files (search TODO to find them easily)
- npm run setup
- npm run start

## dfx commands to deploy
dfx wallet --network ic balance
dfx build --network ic DIP721
dfx build --network ic frontend
dfx canister --network ic create DIP721 --with-cycles 2000000000000
dfx canister --network ic create frontend --with-cycles 1000000000000
dfx canister --network ic install DIP721
dfx canister --network ic install frontend