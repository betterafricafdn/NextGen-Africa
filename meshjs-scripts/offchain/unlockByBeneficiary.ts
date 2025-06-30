import { SLOT_CONFIG_NETWORK, unixTimeToEnclosingSlot } from "@meshsdk/core";
import { blockchainProvider, txBuilder, vestingValidatorScript, wallet2, wallet2Address, wallet2Collateral, wallet2Utxos, wallet2VK } from "./setup.js";

// change utxo here
const vestingUtxo = (await blockchainProvider.fetchUTxOs("47ed2010e01bdc84e1744ec89eb9443fccab973c80ddbb07e05f9c7c3ade1956"))[0];

const invalidBefore = unixTimeToEnclosingSlot(
    (Date.now() - 35000),
    SLOT_CONFIG_NETWORK.preview
)

const unsignedTx = await txBuilder
  .spendingPlutusScriptV3()
  .txIn(
      vestingUtxo.input.txHash,
      vestingUtxo.input.outputIndex,
      vestingUtxo.output.amount,
      vestingUtxo.output.address,
  )
  .txInScript(vestingValidatorScript)
  .spendingReferenceTxInInlineDatumPresent()
  .spendingReferenceTxInRedeemerValue("")
  .txOut(wallet2Address, vestingUtxo.output.amount)
  .changeAddress(wallet2Address)
  .selectUtxosFrom(wallet2Utxos)
  .txInCollateral(
    wallet2Collateral.input.txHash,
    wallet2Collateral.input.outputIndex,
    wallet2Collateral.output.amount,
    wallet2Collateral.output.address,
  )
  .invalidBefore(invalidBefore)
  .requiredSignerHash(wallet2VK)
  .complete()

const signedTx = await wallet2.signTx(unsignedTx);
const txHash = await wallet2.submitTx(signedTx);

console.log(`unlock by beneficiary txHash: ${txHash}`);
