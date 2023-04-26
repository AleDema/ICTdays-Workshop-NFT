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
import Blob "mo:base/Blob";
import Map "mo:map/Map";
import Fuzz "mo:fuzz";
import Prim "mo:prim";
import Iter "mo:base/Iter";
import Timer "mo:base/Timer";
import ICRCTypes "../ledger/Types";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";

shared ({ caller }) actor class Dip721NFT() = Self {

  type Event = {
    id : Text;
    nftName : Text;
    startDate : ?Nat;
    endDate : ?Nat;
    nftType : Text;
    nftUrl : Text;
    limit : ?Nat;
  };

  type CouponStates = {
    #active;
    #frozen;
    #redeemed;
  };

  type Coupon = {
    id : Text;
    startDate : ?Nat;
    endDate : ?Nat;
    amount : Nat;
    state : CouponStates;
    redeemer : ?Principal;
  };
  stable var transactionId : Types.TransactionId = 0;
  stable var nfts = List.nil<Types.Nft>();
  stable var custodian = caller;
  stable var custodians = List.make<Principal>(custodian);
  let { ihash; nhash; thash; phash; calcHash } = Map;
  stable let events = Map.new<Text, Event>(thash);
  stable let coupons = Map.new<Text, Coupon>(thash);
  stable var outstandingCouponsBalance = 0;
  let pthash : Map.HashUtils<(Principal, Text)> = (
    func(key) = (Prim.hashBlob(Prim.blobOfPrincipal(key.0)) +% Prim.hashBlob(Prim.encodeUtf8(key.1))) & 0x3fffffff,
    func(a, b) = a.0 == b.0 and a.1 == b.1,
    func() = (Prim.principalOfBlob(""), ""),
  );
  stable let eventsByPrincipal = Map.new<(Principal, Text), Nat64>(pthash);
  //TODO: add your plug principal here
  custodians := List.push(Principal.fromText("2mz3w-mvsyl-7jyy5-utujh-r3l4n-ww3dm-esjgl-igmix-of4f5-susxa-pqe"), custodians);
  custodians := List.push(Principal.fromText("m2eif-say6u-qkqyb-x57ff-apqcy-phss6-f3k55-5wynb-l3qq5-u4lge-qqe"), custodians);
  custodians := List.push(Principal.fromText("s2e7s-gcq7c-kj7tz-lanqo-w6y6s-ypgss-ltsk2-syyld-k667a-g6cwl-qae"), custodians);
  custodians := List.push(Principal.fromText("ig5qb-sewk3-rxbg6-o7x6w-ns7re-g76um-7wgqr-wcgmp-m53x6-chnps-lae"), custodians);
  custodians := List.push(Principal.fromText("qvpnf-i5sl6-ivj2f-qzood-h364x-kopvb-lxy2k-yh2xf-dh4hg-oy2pl-dqe"), custodians);
  custodians := List.push(Principal.fromText("whaio-wy2tv-opnm3-4ld63-avbfc-zptux-663rl-mhejh-x5szu-45r6s-lqe"), custodians);
  stable var logo : Types.LogoResult = {
    logo_type = "img";
    data = "";
  };
  stable var name : Text = "ICTdays NFT";
  stable var symbol : Text = "ICT";
  stable var maxLimit : Nat16 = 100;
  let CYCLE_AMOUNT : Nat = 1_000_000_000_000;
  let CKBTC_FEE : Nat = 10;
  let IS_PROD = false;
  //TODO: update when deploying on mainnet
  let main_ledger_principal = "db3eq-6iaaa-aaaah-abz6a-cai";
  var icrc_principal = "ryjl3-tyaaa-aaaaa-aaaba-cai";
  if (IS_PROD) {
    icrc_principal := main_ledger_principal;
  };
  let ledger_canister = actor (icrc_principal) : ICRCTypes.TokenInterface;

  stable var storage_canister_id : Text = "";
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

  private func getEventMetadata(name : Text, fileType : Text, url : Text) : Types.MetadataDesc {
    return [{
      purpose = #Rendered;
      key_val_data = [
        {
          key = "name";
          val = #TextContent(name);
        },
        {
          key = "contentType";
          val = #TextContent(fileType);
        },
        {
          key = "locationType";
          val = #TextContent("url");
        },
        {
          key = "location";
          val = #TextContent(url);
        },

      ];
      data = Blob.fromArray([]);
    }];
  };

  public shared ({ caller }) func createCoupon(couponData : Coupon) : async Result.Result<Text, Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not authorized");
    };

    //TODO check ledger balance
    let balance = await ledger_canister.icrc1_balance_of({
      owner = Principal.fromActor(Self);
      subaccount = null;
    });

    if (balance < couponData.amount + CKBTC_FEE + outstandingCouponsBalance) return #err("Not enough balance");

    outstandingCouponsBalance := outstandingCouponsBalance + couponData.amount + CKBTC_FEE;

    let fuzz = Fuzz.Fuzz();
    let couponId = fuzz.text.randomAlphanumeric(16);
    Debug.print(debug_show (couponData));
    Debug.print(debug_show (outstandingCouponsBalance));
    Debug.print(debug_show (balance - outstandingCouponsBalance));
    ignore Map.put(coupons, thash, couponId, { couponData with id = couponId });

    return #ok(couponId);
  };

  public shared ({ caller }) func getCoupons() : async Result.Result<[Coupon], Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not Authorized");
    };
    let iter = Map.vals<Text, Coupon>(coupons);
    return #ok(Iter.toArray(iter));
  };

  public query func getCoupon(couponId : Text) : async Result.Result<Coupon, Text> {
    switch (Map.get(coupons, thash, couponId)) {
      case (?coupon) {
        return #ok(coupon);
      };
      case (null) {
        return #err("No such coupon");
      };
    };
  };

  public shared ({ caller }) func redeemCoupon(couponId : Text) : async Result.Result<Text, Text> {

    if (isAnonymous(caller)) return #err("For your safety you can't withdraw to an anonymous principal, login first");
    var amount = 0;
    switch (Map.get(coupons, thash, couponId)) {
      case (?coupon) {
        if (coupon.state == #frozen) return #err("Coupon is frozen and can't be redeemed");
        if (coupon.state == #redeemed) return #err("Coupon has already been redeemed");
        amount := coupon.amount;
      };
      case (null) {
        return #err("No such coupon");
      };
    };
    //TODO check timeframe

    //TODO ledger transfer
    let res = await ledger_canister.icrc1_transfer({
      to = { owner = caller; subaccount = null };
      fee = ?CKBTC_FEE;
      memo = null;
      from_subaccount = null;
      created_at_time = null;
      amount = amount //decimals
    });
    Debug.print(debug_show (res));
    switch (res) {
      case (#ok(n)) {
        outstandingCouponsBalance := outstandingCouponsBalance - amount - CKBTC_FEE;
        switch (Map.get(coupons, thash, couponId)) {
          case (?coupon) {
            ignore Map.put(coupons, thash, couponId, { coupon with state = #redeemed });
          };
          case (null) {
            return #err("No such coupon");
          };
        };
        return #ok("Success! check your wallet");
      };
      case (#err(_)) {
        return #err("Error!");
      };
    };
  };

  public shared ({ caller }) func updateCouponState(couponId : Text, newState : { #active; #frozen }) : async Result.Result<Text, Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not Authorized");
    };
    switch (Map.get(coupons, thash, couponId)) {
      case (?coupon) {
        if (coupon.state == #redeemed) return #err("Coupon has already been redeemed");

        ignore Map.remove(coupons, thash, couponId);
        ignore Map.put(coupons, thash, couponId, { coupon with state = newState });
        return #ok("Coupon Updated");
      };
      case (null) {
        return #err("No coupon with this ID");
      };
    };
  };

  public shared ({ caller }) func deleteCoupon(couponId : Text) : async Result.Result<Text, Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not Authorized");
    };
    switch (Map.get(coupons, thash, couponId)) {
      case (?coupon) {
        if (coupon.state == #redeemed) return #err("Coupon has already been redeemed");

        ignore Map.remove(coupons, thash, couponId);
        outstandingCouponsBalance := outstandingCouponsBalance - coupon.amount;
        return #ok("Coupon Deleted");
      };
      case (null) {
        return #err("No coupon with this ID");
      };
    };
  };

  public shared ({ caller }) func createEventNft(eventData : Event) : async Result.Result<Text, Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not authorized");
    };

    let fuzz = Fuzz.Fuzz();
    let eventId = fuzz.text.randomAlphanumeric(16);
    Debug.print(debug_show (eventData));
    ignore Map.put(events, thash, eventId, { eventData with id = eventId });
    ignore update_status();
    return #ok(eventId);
  };

  public shared ({ caller }) func getEvents() : async Result.Result<[Event], Text> {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #err("Not Authorized");
    };
    let iter = Map.vals<Text, Event>(events);
    return #ok(Iter.toArray(iter));
  };

  public shared ({ caller }) func claimEventNft(id : Text) : async Result.Result<Text, Text> {

    // get event metadata
    var nftName = "ERROR";
    var nftType = "ERROR";
    var nftUrl = "ERROR";
    switch (Map.get(events, thash, id)) {
      case (?exists) {
        nftName := exists.nftName;
        nftType := exists.nftType;
        nftUrl := exists.nftUrl;
      };
      case (null) {
        return #err("No such event");
      };
    };
    //TODO check timeframe

    //check if user has already redeemed
    let check = Map.get(eventsByPrincipal, pthash, (caller, id));
    switch (check) {
      case (?exists) {
        return #err("Already redeemed");
      };
      case (null) {
        let newId = Nat64.fromNat(List.size(nfts));
        let nft : Types.Nft = {
          owner = caller;
          id = newId;
          metadata = getEventMetadata(nftName, nftType, nftUrl);
        };

        nfts := List.push(nft, nfts);

        transactionId += 1;
        ignore Map.put(eventsByPrincipal, pthash, (caller, id), newId);
        return #ok(Nat64.toText(newId));
      };
    };
  };

  public shared ({ caller }) func mintDip721(to : Principal, metadata : Types.MetadataDesc) : async Types.MintReceipt {
    if (not List.some(custodians, func(custodian : Principal) : Bool { custodian == caller })) {
      return #Err(#Unauthorized);
    };
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

  /////////////////ADMIN////////////////////////////////////

  public shared ({ caller }) func isCustodian() : async Text {
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

  stable var isCreating = false;
  type CreationError = {
    #notenoughcycles;
    #awaitingid;
  };

  public query func get_storage_canister_id() : async Result.Result<Text, { #awaitingid; #nostorageid }> {
    if (isCreating) return #err(#awaitingid);
    if (storage_canister_id == "" and not isCreating) {
      return #err(#nostorageid);
    };
    return #ok(storage_canister_id);

  };

  public shared ({ caller }) func create_storage_canister(isProd : Bool) : async Result.Result<Text, CreationError> {
    if (isCreating) return #err(#awaitingid);
    if (storage_canister_id == "" and not isCreating) {
      isCreating := true;
      let res = await create_file_storage_canister(isProd);
      isCreating := false;
      if (res) { return #ok(storage_canister_id) } else {
        return #err(#notenoughcycles);
      };
    };
    return #ok(storage_canister_id);

  };
  private func create_file_storage_canister(isProd : Bool) : async Bool {
    let balance = Cycles.balance();
    if (balance <= CYCLE_AMOUNT) return false;

    Cycles.add(CYCLE_AMOUNT);
    let file_storage_actor = await FileStorage.FileStorage(isProd);
    ignore file_storage_actor.addCustodians(custodians);
    let principal = Principal.fromActor(file_storage_actor);
    storage_canister_id := Principal.toText(principal);
    ignore add_controller_to_storage();
    return true;

  };

  private func add_controller_to_storage() : async () {
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
    };
    if (check) b.add(custodian);

    let new_controllers = Buffer.toArray(b);
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

  public shared ({ caller }) func init_storage_controllers() : async Result.Result<Text, Text> {
    if (storage_canister_id == "") return #err("No storage canister");

    ignore add_controller_to_storage();
    return #ok("Done");
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
    controllers : [Principal];
  };

  stable var canister_status : CanisterStatus = {
    nft_balance = Cycles.balance();
    storage_balance = 0;
    storage_memory_used = 0;
    storage_daily_burn = 0;
    controllers = [];
  };

  public query func get_status() : async CanisterStatus {
    return canister_status;
  };

  private func update_status() : async () {
    if (storage_canister_id == "") {
      canister_status := {
        canister_status with nft_balance = Cycles.balance();
      };
      return;
    };

    let management_canister_actor : ManagementCanisterActor = actor ("aaaaa-aa");
    let res = await management_canister_actor.canister_status({
      canister_id = Principal.fromText(storage_canister_id);
    });
    Debug.print(debug_show (res.settings.controllers));
    canister_status := {
      nft_balance = Cycles.balance();
      storage_balance = res.cycles;
      storage_memory_used = res.memory_size;
      storage_daily_burn = res.idle_cycles_burned_per_day;
      controllers = res.settings.controllers;
    };

    return;
  };

  // func setTimerA() {
  //   ignore Timer.recurringTimer(
  //     #seconds(10 * 60 * 60),
  //     func() : async () {
  //       Debug.print("fired");
  //       await update_status();
  //     },
  //   );
  // };
  // setTimerA();

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

// public shared ({ caller }) func get_status() : async Result.Result<CanisterStatus, Text> {
//   if (storage_canister_id == "") return #err("No storage canister");

//   let management_canister_actor : ManagementCanisterActor = actor ("aaaaa-aa");
//   let res = await management_canister_actor.canister_status({
//     canister_id = Principal.fromText(storage_canister_id);
//   });
//   Debug.print(debug_show (res.settings.controllers));
//   return #ok({
//     nft_balance = Cycles.balance();
//     storage_balance = res.cycles;
//     storage_memory_used = res.memory_size;
//     storage_daily_burn = res.idle_cycles_burned_per_day;
//     controllers = res.settings.controllers;
//   });
// };
