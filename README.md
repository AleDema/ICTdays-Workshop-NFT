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

dfx canister --network ic install storage --mode upgrade --argument "(true)"

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
              100_000_000_000                                 
          }                                                   
      };                                                      
      min_burn_amount = 10_000_000;                           
      minting_account = null;                                 
      advanced_settings = null;                               
  })"
`


`
  dfx canister install ledger --network ic --argument "( record {                     
      name = \"<ckBTC>\";                         
      symbol = \"<ckBTC>\";                           
      decimals = 8;                                           
      fee = 10;                                        
      max_supply = 1_000_000_000_000;                         
      initial_balances = vec {                                
          record {                                            
              record {                                        
owner = principal \"362pf-fiaaa-aaaap-qbaoq-cai\";   
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

dfx canister call frontend2 set_asset_properties '( record { key="**/*"; allow_raw_access=opt(opt(true)) })'

dfx canister call DIP721 set_storage_canister_id "(principal \"5aui7-6qaaa-aaaap-qba2a-cai\")"
dfx canister call DIP721 --network ic setLedgerCanisterId "(principal \"bkmua-faaaa-aaaap-qbc3a-cai\")"
dfx canister call --network ic DIP721 addCustodian "(principal \"juswz-xp6pw-7ugyq-m4qig-yr5ud-kxxy7-5sw3r-55cxm-7zxab-glxnc-gae\")"
dfx canister call --network ic Storage addCustodian "(principal \"ovjkw-7iaaa-aaaap-qbptq-cai\")"