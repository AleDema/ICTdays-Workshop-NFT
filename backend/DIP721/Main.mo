import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import List "mo:base/List";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Bool "mo:base/Bool";
import Principal "mo:base/Principal";
import Types "./Types";
import Debug "mo:base/Debug";
import Result "mo:base/Result";

shared ({ caller }) actor class Dip721NFT() = Self {
  stable var transactionId : Types.TransactionId = 0;
  var x = 0;
  stable var nfts = List.nil<Types.Nft>();
  stable var custodian = caller;
  stable var custodians = List.make<Principal>(custodian);
  custodians := List.push(Principal.fromText("yn4hf-sjbin-irgim-hudxk-tjkcm-id5ea-3g2h6-p7f6z-nti57-sm5dx-sae"), custodians);
  stable var logo : Types.LogoResult = {
    logo_type = "img";
    data = "";
  };
  stable var name : Text = "NFT Name";
  stable var symbol : Text = "ICT";
  stable var maxLimit : Nat16 = 100;
  let IS_PROD : Bool = true;
  let main_storage_principal = "tpyud-myaaa-aaaap-qa4gq-cai";
  let local_storage_principal = "rkp4c-7iaaa-aaaaa-aaaca-cai";
  var storage_principal = main_storage_principal;
  if (IS_PROD) {
    storage_principal := local_storage_principal;
  };

  let storage_canister = actor (storage_principal) : Types.StorageType;

  // https://forum.dfinity.org/t/is-there-any-address-0-equivalent-at-dfinity-motoko/5445/3
  let null_address : Principal = Principal.fromText("aaaaa-aa");

  public query func balanceOfDip721(user : Principal) : async Nat64 {
    return Nat64.fromNat(
      List.size(
        List.filter(nfts, func(token : Types.Nft) : Bool { token.owner == user })
      )
    );
  };

  public query func ownerOfDip721(token_id : Types.TokenId) : async Types.OwnerResult {
    let item = List.find(nfts, func(token : Types.Nft) : Bool { token.id == token_id });
    switch (item) {
      case (null) {
        return #Err(#InvalidTokenId);
      };
      case (?token) {
        return #Ok(token.owner);
      };
    };
  };

  public shared ({ caller }) func safeTransferFromDip721(from : Principal, to : Principal, token_id : Types.TokenId) : async Types.TxReceipt {
    if (to == null_address) {
      return #Err(#ZeroAddress);
    } else {
      return transferFrom(from, to, token_id, caller);
    };
  };

  public shared ({ caller }) func transferFromDip721(from : Principal, to : Principal, token_id : Types.TokenId) : async Types.TxReceipt {
    return transferFrom(from, to, token_id, caller);
  };

  func transferFrom(from : Principal, to : Principal, token_id : Types.TokenId, caller : Principal) : Types.TxReceipt {
    let item = List.find(nfts, func(token : Types.Nft) : Bool { token.id == token_id });
    switch (item) {
      case null {
        return #Err(#InvalidTokenId);
      };
      case (?token) {
        if (
          caller != token.owner and not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })
        ) {
          return #Err(#Unauthorized);
        } else if (Principal.notEqual(from, token.owner)) {
          return #Err(#Other);
        } else {
          nfts := List.map(
            nfts,
            func(item : Types.Nft) : Types.Nft {
              if (item.id == token.id) {
                let update : Types.Nft = {
                  owner = to;
                  id = item.id;
                  metadata = token.metadata;
                };
                return update;
              } else {
                return item;
              };
            },
          );
          transactionId += 1;
          return #Ok(transactionId);
        };
      };
    };
  };

  public query func supportedInterfacesDip721() : async [Types.InterfaceId] {
    return [#TransferNotification, #Burn, #Mint];
  };

  public query func logoDip721() : async Types.LogoResult {
    return logo;
  };

  public query func nameDip721() : async Text {
    return name;
  };

  public query func symbolDip721() : async Text {
    return symbol;
  };

  public query func totalSupplyDip721() : async Nat64 {
    return Nat64.fromNat(
      List.size(nfts)
    );
  };

  public query func getMetadataDip721(token_id : Types.TokenId) : async Types.MetadataResult {
    let item = List.find(nfts, func(token : Types.Nft) : Bool { token.id == token_id });
    switch (item) {
      case null {
        return #Err(#InvalidTokenId);
      };
      case (?token) {
        return #Ok(token.metadata);
      };
    };
  };

  public query func getMaxLimitDip721() : async Nat16 {
    return maxLimit;
  };

  public func getMetadataForUserDip721(user : Principal) : async Types.ExtendedMetadataResult {
    let item = List.find(nfts, func(token : Types.Nft) : Bool { token.owner == user });
    switch (item) {
      case null {
        return #Err(#Other);
      };
      case (?token) {
        return #Ok({
          metadata_desc = token.metadata;
          token_id = token.id;
        });
      };
    };
  };

  public query func getTokenIdsForUserDip721(user : Principal) : async [Types.TokenId] {
    let items = List.filter(nfts, func(token : Types.Nft) : Bool { token.owner == user });
    let tokenIds = List.map(items, func(item : Types.Nft) : Types.TokenId { item.id });
    return List.toArray(tokenIds);
  };

  public shared ({ caller }) func mintDip721(to : Principal, metadata : Types.MetadataDesc) : async Types.MintReceipt {
    //TODO script
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #Err(#Unauthorized);
    };
    // Debug.print(debug_show (caller));
    let newId = Nat64.fromNat(List.size(nfts));
    let nft : Types.Nft = {
      owner = to;
      id = newId;
      metadata = metadata;
    };

    nfts := List.push(nft, nfts);

    transactionId += 1;
    //TODO notifyMaster()
    return #Ok({
      token_id = newId;
      id = transactionId;
    });
  };

  public shared ({ caller }) func isCustodian() : async Text {
    // Debug.print(debug_show (caller));
    // Debug.print(debug_show (custodians));
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return "not custodian";
    };
    return "custodian";
  };

  public shared ({ caller }) func addCustodian(new_custodian : Principal) : async Result.Result<Text, Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("not custodian");
    };
    custodians := List.push(new_custodian, custodians);
    ignore storage_canister.addCustodian(new_custodian);
    return #ok("custodian");
  };
};
