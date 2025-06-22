use aiken/collection/dict
use cardano/assets.{PolicyId, from_asset}
use cardano/transaction.{Transaction, placeholder}
use mocktail/virgin_key_hash.{mock_script_hash}

pub type Action {
  Minting
  Burning
}

validator mint_burn_nft {
  mint(redeemer: Action, policy_id: PolicyId, tx: Transaction) {
    let Transaction { mint, .. } = tx

    expect [Pair(_asset_name, quantity)] =
      mint |> assets.tokens(policy_id) |> dict.to_pairs

    when redeemer is {
      Minting -> (quantity == 1)?
      Burning -> (quantity == -1)?
    }
  }

  else(_) {
    fail
  }
}

test mint_nft() {
  let mbn_validator_pid = mock_script_hash(0)
  let asset_name = "NG_NFT"

  let mint = from_asset(mbn_validator_pid, asset_name, 1)

  let tx = Transaction { ..placeholder, mint: mint }

  mint_burn_nft.mint(Minting, mbn_validator_pid, tx)
}

test burn_nft() {
  let mbn_validator_pid = mock_script_hash(0)
  let asset_name = "NG_NFT"

  let mint = from_asset(mbn_validator_pid, asset_name, -1)

  let tx = Transaction { ..placeholder, mint: mint }

  mint_burn_nft.mint(Burning, mbn_validator_pid, tx)
}

test mint_nft_fail() fail {
  let mbn_validator_pid = mock_script_hash(0)
  let asset_name = "NG_NFT"

  let mint = from_asset(mbn_validator_pid, asset_name, -1)

  let tx = Transaction { ..placeholder, mint: mint }

  mint_burn_nft.mint(Minting, mbn_validator_pid, tx)
}

test burn_nft_fail() fail {
  let mbn_validator_pid = mock_script_hash(0)
  let asset_name = "NG_NFT"

  let mint = from_asset(mbn_validator_pid, asset_name, 1)

  let tx = Transaction { ..placeholder, mint: mint }

  mint_burn_nft.mint(Burning, mbn_validator_pid, tx)
}
