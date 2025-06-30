import { mConStr0, stringToHex } from "@meshsdk/core";
import { mintingPolicy, mintingValidatorScript, txBuilder, wallet, walletAddress, walletCollateral, walletUtxos } from "./setup.js";

const assetNameHex = stringToHex("exNFT");

const unsignedTx = await txBuilder
  .mintPlutusScriptV3()
  .mint("1", mintingPolicy, assetNameHex)
  .mintingScript(mintingValidatorScript)
  .mintRedeemerValue(mConStr0([]))
  .txOut(walletAddress, [ { unit: mintingPolicy + assetNameHex, quantity: "1" } ])
  .changeAddress(walletAddress)
  .selectUtxosFrom(walletUtxos)
  .txInCollateral(
    walletCollateral.input.txHash,
    walletCollateral.input.outputIndex,
    walletCollateral.output.amount,
    walletCollateral.output.address,
  )
  .complete()

const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);

console.log(`mint nft txHash: ${txHash}`);
