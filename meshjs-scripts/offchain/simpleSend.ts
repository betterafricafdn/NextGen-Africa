import { txBuilder, wallet, walletAddress, walletUtxos } from "./setup.js";

const receiverAddress = "addr_test1qq4tef9zynn5ll8accrhm69dz9ruafpj65g7tzna9veyx4yxnradjhp48022vpmamw7j97su3t7e9sn9awmu5wjtqkjsnjxwqa";
const unsignedTx = await txBuilder
  // send 50 ADA
  .txOut(receiverAddress, [ { unit: "lovelace", quantity: "50000000" } ])
  .changeAddress(walletAddress)
  .selectUtxosFrom(walletUtxos)
  .complete()

const signedTx = await wallet.signTx(unsignedTx);
const txHash = await wallet.submitTx(signedTx);

console.log(`simple send txHash: ${txHash}`);
