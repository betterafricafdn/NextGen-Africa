use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/transaction.{OutputReference, Transaction, ValidityRange}
use cocktail/vodka_extra_signatories.{key_signed}
use cocktail/vodka_validity_range.{valid_after}

pub type VestingDatum {
  lock_until: Int,
  owner: VerificationKeyHash,
  beneficiary: VerificationKeyHash,
}

validator placeholder {
  spend(
    datum_opt: Option<VestingDatum>,
    _redeemer: Data,
    _utxo: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt

    let VestingDatum { lock_until, beneficiary, owner } = datum

    or {
      key_signed(tx.extra_signatories, owner),
      and {
        key_signed(tx.extra_signatories, beneficiary),
        valid_after(tx.validity_range, lock_until),
      },
    }
  }

  else(_) {
    fail
  }
}

pub fn is_signed(
  signers_list: List<VerificationKeyHash>,
  signer: VerificationKeyHash,
) {
  list.has(signers_list, signer)
}

pub fn is_valid_time(range: ValidityRange, lock_until: Int) {
  expect Finite(lower_bound_time) = range.lower_bound.bound_type

  lock_until <= lower_bound_time
}
