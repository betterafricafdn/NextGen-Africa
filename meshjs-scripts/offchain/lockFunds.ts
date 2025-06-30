import { mConStr0 } from "@meshsdk/core";
import { txBuilder, vestingAddress, wallet, wallet2VK, walletAddress, walletUtxos, walletVK } from "./setup.js";

const lockDatum = mConStr0([
    new Date().getTime() + (10 * 60 * 1000), // 10 mins
    walletVK,
    wallet2VK,
]);

const unsignedTx = await txBuilder
//   lock 150 ADA
  .txOut(vestingAddress, [ { unit: "lovelace", quantity: "150000000" } ])
  .txOutInlineDatumValue(lockDatum)
  .changeAddress(walletAddress)
  .selectUtxosFrom(walletUtxos)
  .complete()

const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);

console.log(`lock funds txHash: ${txHash}`);
