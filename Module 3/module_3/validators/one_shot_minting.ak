use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

pub type Action {
  Minting
  Burning
}

validator mint_burn_nft(utxo_ref: OutputReference) {
  mint(redeemer: Action, policy_id: PolicyId, tx: Transaction) {
    let Transaction { mint, inputs, .. } = tx

    expect [Pair(_asset_name, quantity)] =
      mint |> assets.tokens(policy_id) |> dict.to_pairs

    let is_utxo_spent =
      list.any(inputs, fn(input) { input.output_reference == utxo_ref })

    when redeemer is {
      Minting -> and {
          is_utxo_spent?,
          (quantity == 1)?,
        }
      Burning -> (quantity == -1)?
    }
  }

  else(_) {
    fail
  }
}
