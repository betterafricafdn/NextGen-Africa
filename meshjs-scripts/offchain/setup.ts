import { applyParamsToScript, deserializeAddress, MaestroProvider, mConStr0, mConStr1, MeshTxBuilder, MeshWallet, resolveScriptHash, serializePlutusScript, SLOT_CONFIG_NETWORK, stringToHex, unixTimeToEnclosingSlot, UTxO } from "@meshsdk/core";
import dotenv from "dotenv";
dotenv.config();
import blueprint from "../smart_contracts/plutus.json" with { type: "json" }

// Setup blockchain provider as Maestro
const maestroKey = process.env.MAESTRO_KEY;
if (!maestroKey) {
    throw new Error("MAESTRO_KEY does not exist");
}
const blockchainProvider = new MaestroProvider({
    network: 'Preview',
    apiKey: maestroKey,
});

// Wallet
const walletPassphrase = process.env.WALLET_PASSPHRASE_ONE;
if (!walletPassphrase) {
    throw new Error("WALLET_PASSPHRASE_ONE does not exist");
}

const wallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: walletPassphrase.split(' ')
    },
});

const walletAddress = await wallet.getChangeAddress();
// console.log("Wallet address", walletAddress);

const walletUtxos = await wallet.getUtxos();
// const walletCollateral: UTxO = (await blockchainProvider.fetchUTxOs("cab914aca4fb11f8ed0d736915cc77a756a0b3abd8baebb2a39c734b60849c2e", 2))[0];
const walletCollateral: UTxO = (await wallet.getCollateral())[0];
if (!walletCollateral) {
    throw new Error('No collateral utxo found 1');
}

const { pubKeyHash: walletVK, stakeCredentialHash: walletSK } = deserializeAddress(walletAddress);

// Second wallet
const wallet2Passphrase = process.env.WALLET_PASSPHRASE_TWO;
if (!wallet2Passphrase) {
    throw new Error("WALLET_PASSPHRASE_TWO does not exist");
}
const wallet2 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet2Passphrase.split(' ')
    },
});
const wallet2Address = await wallet2.getChangeAddress();
const { pubKeyHash: wallet2VK } = deserializeAddress(wallet2Address);
const wallet2Utxos = await wallet2.getUtxos();
const wallet2Collateral: UTxO = (await wallet2.getCollateral())[0]
if (!wallet2Collateral) {
    throw new Error('No collateral utxo found 2');
}

// Create transaction builder
const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
});

txBuilder.setNetwork('preview');

// vesting validator
const vestingValidator = blueprint.validators.filter(v => (
    v.title.includes("vesting.vesting.spend")
));
const vestingValidatorScript = applyParamsToScript(
    vestingValidator[0].compiledCode,
    [],
    "JSON",
);
// console.log("vestingValidator:", vestingValidator);
// console.log("vestingValidatorScript:", vestingValidatorScript);
const vestingValidatorHash = resolveScriptHash(vestingValidatorScript, "V3");
const vestingAddress = serializePlutusScript(
    { code: vestingValidatorScript, version: "V3" },
    undefined,
    0,
).address;

// minting validator
const mintingValidator = blueprint.validators.filter(v => (
    v.title.includes("minting.mint_nft.mint")
));
const mintingValidatorScript = applyParamsToScript(
    mintingValidator[0].compiledCode,
    [],
    "JSON",
);
const mintingPolicy = resolveScriptHash(mintingValidatorScript, "V3");
const mintingAddress = serializePlutusScript(
    { code: mintingValidatorScript, version: "V3" },
    undefined,
    0,
).address;

export {
    txBuilder,
    blockchainProvider,
    wallet,
    walletVK,
    walletAddress,
    walletUtxos,
    walletCollateral,
    wallet2,
    wallet2VK,
    wallet2Address,
    wallet2Utxos,
    wallet2Collateral,
    vestingValidatorScript,
    vestingAddress,
    mintingValidatorScript,
    mintingAddress,
    mintingPolicy,
}
