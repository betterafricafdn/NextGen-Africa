import { applyParamsToScript, IWallet, resolveScriptHash, serializePlutusScript } from "@meshsdk/core";
import blueprint from "./plutus.json" with { type: "json" }

export async function getWalletForTx(wallet: IWallet) {
    const utxos = await wallet.getUtxos();
    const collateral = (await wallet.getCollateral())[0];
    const walletAddress = await wallet.getChangeAddress();

    if (!utxos || utxos?.length === 0) {
        throw new Error("No utxos found");
    }
    if (!collateral) {
        throw new Error("No collateral found");
    }
    if (!walletAddress) {
        throw new Error("No wallet address found");
    }

    return { utxos, collateral, walletAddress };
}

export async function getVestingValidator() {
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

    return {
        vestingValidatorScript: vestingValidatorScript,
        vestingValidatorHash: vestingValidatorHash,
        vestingAddress: vestingAddress,
    };
}
