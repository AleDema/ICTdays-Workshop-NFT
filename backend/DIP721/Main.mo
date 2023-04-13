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
import FileStorage "../Storage/FileStorage";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";

shared ({ caller }) actor class Dip721NFT() = Self {
  stable var transactionId : Types.TransactionId = 0;
  stable var nfts = List.nil<Types.Nft>();
  stable var custodian = caller;
  stable var custodians = List.make<Principal>(custodian);
  //TODO: add your plug principal here
  custodians := List.push(Principal.fromText("m2eif-say6u-qkqyb-x57ff-apqcy-phss6-f3k55-5wynb-l3qq5-u4lge-qqe"), custodians);
  custodians := List.push(Principal.fromText("s2e7s-gcq7c-kj7tz-lanqo-w6y6s-ypgss-ltsk2-syyld-k667a-g6cwl-qae"), custodians);
  custodians := List.push(Principal.fromText("ig5qb-sewk3-rxbg6-o7x6w-ns7re-g76um-7wgqr-wcgmp-m53x6-chnps-lae"), custodians);
  custodians := List.push(Principal.fromText("qvpnf-i5sl6-ivj2f-qzood-h364x-kopvb-lxy2k-yh2xf-dh4hg-oy2pl-dqe"), custodians);
  stable var logo : Types.LogoResult = {
    logo_type = "img";
    data = "";
  };
  stable var name : Text = "NFT Name";
  stable var symbol : Text = "ICT";
  stable var maxLimit : Nat16 = 100;
  let IS_PROD : Bool = true;
  let CYCLE_AMOUNT : Nat = 1_000_000_000_000;

  stable var storage_canister_id : Text = "";
  //stable var storage_canister : Types.StorageType = actor (storage_canister_id);

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

    if (storage_canister_id != "") {
      let storage_canister : Types.StorageType = actor (storage_canister_id);
      ignore storage_canister.addCustodian(new_custodian);
    };
    return #ok("custodian");
  };

  type definite_canister_settings = {
    controllers : [Principal];
    compute_allocation : Nat;
    memory_allocation : Nat;
    freezing_threshold : Nat;
  };

  type canister_settings = {
    controllers : ?[Principal];
    compute_allocation : ?Nat;
    memory_allocation : ?Nat;
    freezing_threshold : ?Nat;
  };

  type ManagementCanisterActor = actor {
    canister_status : ({ canister_id : Principal }) -> async ({
      status : { #running; #stopping; #stopped };
      settings : definite_canister_settings;
      module_hash : ?Blob;
      memory_size : Nat;
      cycles : Nat;
      idle_cycles_burned_per_day : Nat;
    });

    update_settings : (
      {
        canister_id : Principal;
        settings : canister_settings;
      }
    ) -> ();
  };

  private func create_file_storage_canister(isProd : Bool) : async Bool {
    let balance = Cycles.balance();
    Debug.print("balance");
    Debug.print(debug_show (balance));
    if (balance <= CYCLE_AMOUNT) return false;
    Cycles.add(CYCLE_AMOUNT);
    let file_storage_actor = await FileStorage.FileStorage(isProd);
    ignore file_storage_actor.addCustodians(custodians);
    let principal = Principal.fromActor(file_storage_actor);
    storage_canister_id := Principal.toText(principal);
    let management_canister_actor : ManagementCanisterActor = actor ("aaaaa-aa");
    let res = await management_canister_actor.canister_status({
      canister_id = principal;
    });
    Debug.print(debug_show (res));
    ignore add_controller_to_storage();
    return true;

  };

  private func add_controller_to_storage() : async () {
    if (storage_canister_id == "") return;

    let management_canister_actor : ManagementCanisterActor = actor ("aaaaa-aa");
    let principal = Principal.fromText(storage_canister_id);
    let res = await management_canister_actor.canister_status({
      canister_id = principal;
    });
    Debug.print(debug_show (res));
    let b = Buffer.Buffer<Principal>(1);
    var check = true;
    for (controller in res.settings.controllers.vals()) {
      b.add(controller);
      if (Principal.equal(controller, custodian)) {
        check := false;
      };
      Debug.print(debug_show (controller));
    };
    if (check) b.add(custodian);

    let new_controllers = Buffer.toArray(b);
    Debug.print(debug_show (new_controllers));
    Debug.print(debug_show (principal));
    management_canister_actor.update_settings({
      canister_id = principal;
      settings = {
        controllers = ?new_controllers;
        compute_allocation = ?res.settings.compute_allocation;
        memory_allocation = ?res.settings.memory_allocation;
        freezing_threshold = ?res.settings.freezing_threshold;
      };
    });
  };

  public shared ({ caller }) func init_storage_controllers() : async () {
    ignore add_controller_to_storage();
  };

  public shared ({ caller }) func get_storage_canister_id(isProd : Bool) : async Result.Result<Text, Text> {
    if (storage_canister_id == "") {
      let res = await create_file_storage_canister(isProd);
      if (res) { return #ok(storage_canister_id) } else {
        return #err("Not enough cycles");
      };
    };
    return #ok(storage_canister_id);

  };

  public shared ({ caller }) func set_storage_canister_id(id : Principal) : async Result.Result<Text, Text> {

    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("not allowed");
    };

    if (not isCanisterPrincipal(id) or isAnonymous(id)) {
      return #err("invalid principal");
    };

    storage_canister_id := Principal.toText(id);
    return #ok("storage_canister_id set");
  };

  type CanisterStatus = {
    nft_balance : Nat;
    storage_balance : Nat;
    storage_memory_used : Nat;
    storage_daily_burn : Nat;
  };

  public shared ({ caller }) func get_storage_status() : async CanisterStatus {
    let management_canister_actor : ManagementCanisterActor = actor ("aaaaa-aa");
    let res = await management_canister_actor.canister_status({
      canister_id = Principal.fromText(storage_canister_id);
    });
    Debug.print(debug_show (res));
    return {
      nft_balance = Cycles.balance();
      storage_balance = res.cycles;
      storage_memory_used = res.memory_size;
      storage_daily_burn = res.idle_cycles_burned_per_day;
    };
  };

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isCanisterPrincipal(p : Principal) : Bool {
    let principal_text = Principal.toText(p);
    let correct_length = Text.size(principal_text) == 27;
    let correct_last_characters = Text.endsWith(principal_text, #text "-cai");

    if (Bool.logand(correct_length, correct_last_characters)) {
      return true;
    };
    return false;
  };
};
