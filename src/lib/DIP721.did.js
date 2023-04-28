export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok': IDL.Text, 'err': IDL.Text });
  const CouponStates = IDL.Variant({
    'active': IDL.Null,
    'redeemed': IDL.Null,
    'frozen': IDL.Null,
  });
  const Coupon = IDL.Record({
    'id': IDL.Text,
    'endDate': IDL.Opt(IDL.Nat),
    'redeemer': IDL.Opt(IDL.Principal),
    'state': CouponStates,
    'amount': IDL.Nat,
    'startDate': IDL.Opt(IDL.Nat),
  });
  const Event = IDL.Record({
    'id': IDL.Text,
    'nftUrl': IDL.Text,
    'endDate': IDL.Opt(IDL.Nat),
    'limit': IDL.Opt(IDL.Nat),
    'nftName': IDL.Text,
    'nftType': IDL.Text,
    'startDate': IDL.Opt(IDL.Nat),
  });
  const CreationError = IDL.Variant({
    'notenoughcycles': IDL.Null,
    'awaitingid': IDL.Null,
  });
  const Result_6 = IDL.Variant({ 'ok': IDL.Text, 'err': CreationError });
  const Result_5 = IDL.Variant({ 'ok': Coupon, 'err': IDL.Text });
  const Result_4 = IDL.Variant({ 'ok': IDL.Vec(Coupon), 'err': IDL.Text });
  const Result_3 = IDL.Variant({ 'ok': Event, 'err': IDL.Text });
  const Result_2 = IDL.Variant({ 'ok': IDL.Vec(Event), 'err': IDL.Text });
  const TokenId = IDL.Nat64;
  const MetadataVal = IDL.Variant({
    'Nat64Content': IDL.Nat64,
    'Nat32Content': IDL.Nat32,
    'Nat8Content': IDL.Nat8,
    'NatContent': IDL.Nat,
    'Nat16Content': IDL.Nat16,
    'BlobContent': IDL.Vec(IDL.Nat8),
    'TextContent': IDL.Text,
  });
  const MetadataKeyVal = IDL.Record({ 'key': IDL.Text, 'val': MetadataVal });
  const MetadataPurpose = IDL.Variant({
    'Preview': IDL.Null,
    'Rendered': IDL.Null,
  });
  const MetadataPart = IDL.Record({
    'data': IDL.Vec(IDL.Nat8),
    'key_val_data': IDL.Vec(MetadataKeyVal),
    'purpose': MetadataPurpose,
  });
  const MetadataDesc = IDL.Vec(MetadataPart);
  const ApiError = IDL.Variant({
    'ZeroAddress': IDL.Null,
    'InvalidTokenId': IDL.Null,
    'Unauthorized': IDL.Null,
    'Other': IDL.Null,
  });
  const MetadataResult = IDL.Variant({ 'Ok': MetadataDesc, 'Err': ApiError });
  const ExtendedMetadataResult = IDL.Variant({
    'Ok': IDL.Record({ 'token_id': TokenId, 'metadata_desc': MetadataDesc }),
    'Err': ApiError,
  });
  const CanisterStatus = IDL.Record({
    'storage_memory_used': IDL.Nat,
    'controllers': IDL.Vec(IDL.Principal),
    'storage_daily_burn': IDL.Nat,
    'storage_balance': IDL.Nat,
    'nft_balance': IDL.Nat,
  });
  const Result_1 = IDL.Variant({
    'ok': IDL.Text,
    'err': IDL.Variant({ 'nostorageid': IDL.Null, 'awaitingid': IDL.Null }),
  });
  const LogoResult = IDL.Record({ 'data': IDL.Text, 'logo_type': IDL.Text });
  const MintReceiptPart = IDL.Record({ 'id': IDL.Nat, 'token_id': TokenId });
  const MintReceipt = IDL.Variant({ 'Ok': MintReceiptPart, 'Err': ApiError });
  const OwnerResult = IDL.Variant({ 'Ok': IDL.Principal, 'Err': ApiError });
  const TxReceipt = IDL.Variant({ 'Ok': IDL.Nat, 'Err': ApiError });
  const InterfaceId = IDL.Variant({
    'Burn': IDL.Null,
    'Mint': IDL.Null,
    'Approval': IDL.Null,
    'TransactionHistory': IDL.Null,
    'TransferNotification': IDL.Null,
  });
  const Dip721NFT = IDL.Service({
    'addCustodian': IDL.Func([IDL.Principal], [Result], []),
    'balanceOfDip721': IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'claimEventNft': IDL.Func([IDL.Text], [Result], []),
    'createCoupon': IDL.Func([Coupon], [Result], []),
    'createEventNft': IDL.Func([Event], [Result], []),
    'create_storage_canister': IDL.Func([IDL.Bool], [Result_6], []),
    'deleteCoupon': IDL.Func([IDL.Text], [Result], []),
    'getCoupon': IDL.Func([IDL.Text], [Result_5], ['query']),
    'getCoupons': IDL.Func([], [Result_4], []),
    'getEvent': IDL.Func([IDL.Text], [Result_3], ['query']),
    'getEvents': IDL.Func([], [Result_2], []),
    'getMaxLimitDip721': IDL.Func([], [IDL.Nat16], ['query']),
    'getMetadataDip721': IDL.Func([TokenId], [MetadataResult], ['query']),
    'getMetadataForUserDip721': IDL.Func(
      [IDL.Principal],
      [ExtendedMetadataResult],
      [],
    ),
    'getTokenIdsForUserDip721': IDL.Func(
      [IDL.Principal],
      [IDL.Vec(TokenId)],
      ['query'],
    ),
    'get_ledger_canister_id': IDL.Func([], [IDL.Text], ['query']),
    'get_status': IDL.Func([], [CanisterStatus], ['query']),
    'get_storage_canister_id': IDL.Func([], [Result_1], ['query']),
    'init_storage_controllers': IDL.Func([], [Result], []),
    'isCustodian': IDL.Func([], [IDL.Text], []),
    'logoDip721': IDL.Func([], [LogoResult], ['query']),
    'mintDip721': IDL.Func([IDL.Principal, MetadataDesc], [MintReceipt], []),
    'nameDip721': IDL.Func([], [IDL.Text], ['query']),
    'ownerOfDip721': IDL.Func([TokenId], [OwnerResult], ['query']),
    'redeemCoupon': IDL.Func([IDL.Text], [Result], []),
    'redeemCouponToPrincipal': IDL.Func(
      [IDL.Text, IDL.Principal],
      [Result],
      [],
    ),
    'safeTransferFromDip721': IDL.Func(
      [IDL.Principal, IDL.Principal, TokenId],
      [TxReceipt],
      [],
    ),
    'set_ledger_canister_id': IDL.Func([IDL.Principal], [Result], []),
    'set_storage_canister_id': IDL.Func([IDL.Principal], [Result], []),
    'supportedInterfacesDip721': IDL.Func(
      [],
      [IDL.Vec(InterfaceId)],
      ['query'],
    ),
    'symbolDip721': IDL.Func([], [IDL.Text], ['query']),
    'totalSupplyDip721': IDL.Func([], [IDL.Nat64], ['query']),
    'transferFromDip721': IDL.Func(
      [IDL.Principal, IDL.Principal, TokenId],
      [TxReceipt],
      [],
    ),
    'updateCouponState': IDL.Func(
      [IDL.Text, IDL.Variant({ 'active': IDL.Null, 'frozen': IDL.Null })],
      [Result],
      [],
    ),
  });
  return Dip721NFT;
};
export const init = ({ IDL }) => { return []; };
