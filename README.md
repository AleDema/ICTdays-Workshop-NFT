# ICTdays-workshop-NFT
Public repo for the boilerplate code used in the ICTdays ICP presentation


## How to Install and run locally
- install dfx
- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
- nvm install --lts
- dfx start --clean --emulator
- update admin in .mo files (search TODO to find them easily)
- npm run setup
- npm run start
- add localnet in plug settings

## dfx commands to deploy on mainnet
- dfx wallet --network ic redeem-faucet-coupon codicecouponhere
- dfx wallet --network ic balance //Check if you have enough cycles
- dfx canister --network ic create DIP721 --with-cycles 2000000000000 //Required only once
- dfx canister --network ic create frontend --with-cycles 1000000000000 //Required only once
- dfx build --network ic DIP721
- dfx build --network ic frontend
- dfx canister --network ic install DIP721
- dfx canister --network ic install frontend
- dfx canister --network ic deposit-cycles 1000000000000 canister_name //In case you need to top up a canister
- dfx canister --network ic status  5aui7-6qaaa-aaaap-qba2a-cai
- IMPORTANT: if you need to upgrade a canister use  dfx canister --network ic install --mode upgrade instead of mode=reinstall or you'll lose the canister state and the storage canister reference with it.

## How to access the ICTdays DAO

 Once you have deployed your canister on mainnet you can join this DAO: https://wzd4v-iaaaa-aaaap-qbbfa-cai.ic0.app/

  To register login with plug on that page and insert the canister id of your minter (DIP721 canister), it can be found in the canister_ids.json file in your project.
it will look something like this:

`
  "DIP721": {
    "ic": "362pf-fiaaa-aaaap-qbaoq-cai"
  },
`

you only need this part: `362pf-fiaaa-aaaap-qbaoq-cai`
`
  dfx deploy ledger --argument "( record {                     
      name = \"<ckBTC>\";                         
      symbol = \"<ckBTC>\";                           
      decimals = 8;                                           
      fee = 10;                                        
      max_supply = 1_000_000_000_000;                         
      initial_balances = vec {                                
          record {                                            
              record {                                        
owner = principal \"rrkah-fqaaa-aaaaa-aaaaq-cai\";   
                  subaccount = null;                                  
              };                                              
              100_000_000_000_000_000                                 
          }                                                   
      };                                                      
      min_burn_amount = 10_000_000;                           
      minting_account = null;                                 
      advanced_settings = null;                               
  })"
`