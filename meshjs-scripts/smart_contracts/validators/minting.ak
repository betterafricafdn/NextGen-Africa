use aiken/collection/dict
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}

pub type Action {
  Minting
  Burning
}

validator mint_nft {
  mint(redeemer: Action, policy_id: PolicyId, self: Transaction) {
    // It checks that only one minted asset exists and will fail otherwise
    expect [Pair(_asset_name, quantity)] =
      self.mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    when redeemer is {
      Minting -> (quantity == 1)?
      Burning -> (quantity == -1)?
    }
  }

  else(_) {
    fail
  }
}
