import { blockchainProvider, txBuilder, vestingValidatorScript, wallet, walletAddress, walletCollateral, walletUtxos, walletVK } from "./setup.js";

// change utxo here
const vestingUtxo = (await blockchainProvider.fetchUTxOs("631486aa7139b8e1db7669d5ba3b98cab23ad3add4be332cbabb3989542751f7"))[0];

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
  .txOut(walletAddress, vestingUtxo.output.amount)
  .changeAddress(walletAddress)
  .selectUtxosFrom(walletUtxos)
  .txInCollateral(
    walletCollateral.input.txHash,
    walletCollateral.input.outputIndex,
    walletCollateral.output.amount,
    walletCollateral.output.address,
  )
  .requiredSignerHash(walletVK)
  .complete()

const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);

console.log(`unlock by owner txHash: ${txHash}`);
