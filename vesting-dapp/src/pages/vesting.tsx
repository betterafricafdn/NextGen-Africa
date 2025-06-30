import { Button } from "@/layouts/Button";
import { Input } from "@/layouts/Input";
import { Asset, BlockfrostProvider, BuiltinByteString, ConStr0, deserializeAddress, deserializeDatum, Integer, IWallet, mConStr0, MConStr0, MeshTxBuilder, SLOT_CONFIG_NETWORK, unixTimeToEnclosingSlot, UTxO } from "@meshsdk/core";
import { useEffect, useState } from "react";
import { getVestingValidator, getWalletForTx } from "../../utils";

interface VestingType {
    meshTxBuilder: MeshTxBuilder | null;
    blockchainProvider: BlockfrostProvider | undefined;
    wallet: IWallet,
}

type lockDurationType = {
    time: number;
    title: string;  
}[];

// time in minutes
const lockDurations: lockDurationType = [
    {
        time: 6,
        title: "Test (6 mins)"
    },
    {
        time: 3 * 60,
        title: "3 hours"
    },
    {
        time: 3 * 24 * 60,
        title: "3 days"
    },
    {
        time: 3 * 7 * 24 * 60,
        title: "3 weeks"
    },
    {
        time: 12 * 7 * 24 * 60,
        title: "3 months (12 wks)"
    },
];

type Datum = ConStr0<
    [Integer, BuiltinByteString, BuiltinByteString]
>;

export default function Vesting({ meshTxBuilder, blockchainProvider, wallet }: VestingType) {
    const [lockAdaAmount, setLockAdaAmount] = useState<string>("");
    const [lockAdaAddresses, setLockAdaAddresses] = useState<string>("");
    const [lockDuration, setLockDuration] = useState<string>("");
    const [utxoLockList, setUtxoLockList] = useState<UTxO[] | undefined>([]);
    const [locking, setLocking] = useState<boolean>(false);
    const [unlocking, setUnlocking] = useState<string | null>(null);
    const [lockTxHash, setLockTxHash] = useState<string | undefined>(undefined);
    const [unlockTxHash, setUnlockTxHash] = useState<string | undefined>(undefined);

    const validator = getVestingValidator();

    const lockDurationOptions = lockDurations.map(duration => (
        <option key={duration.title} id={duration.title} value={duration.time}>{duration.title}</option>
    ));

    type lockTxDetailsType = {
        txHash: string | undefined;
        datumList: MConStr0<(string | number)[]>[];
    }
    const [lockTxDetails, setLockTxDetails] = useState<lockTxDetailsType>({ txHash: "", datumList: [] });

    const handleLock = async () => {
        setLocking(true);

        try {
            const lockUntil = new Date();
            lockUntil.setMinutes(Number(lockDuration) + lockUntil.getMinutes());

            const { utxos, walletAddress } = await getWalletForTx(wallet);
            const { pubKeyHash: ownerPubKeyHash } = deserializeAddress(walletAddress);

            const addressesArray = lockAdaAddresses.split(/[,\s]+/);

            const datumList: MConStr0<(string | number)[]>[] = [];
            for (let i = 0; i < addressesArray.length; i++) {
                const { pubKeyHash: beneficiaryPubKeyHash } = deserializeAddress(addressesArray[i]);
                const datum = mConStr0([
                    lockUntil.getTime(),
                    ownerPubKeyHash,
                    beneficiaryPubKeyHash
                ]);
                datumList.push(datum);
            }

            const lovelace = BigInt(Math.round((Number(lockAdaAmount) / datumList.length)) * 1000000);
            // remove below
            console.log(`String lovelace: ${lovelace}`);
            const assets: Asset[] = [
                {
                    unit: "lovelace",
                    quantity: lovelace.toString()
                }
            ];

            const scriptAddr = (await validator).vestingAddress;

            const txBuilder = meshTxBuilder;

            for (const datum of datumList) {
                txBuilder?.txOut(scriptAddr, assets)
                    .txOutInlineDatumValue(datum)
            };

            // console.log("walletAddress:", walletAddress);
            const unsignedTx = await txBuilder?.changeAddress(walletAddress)
                .selectUtxosFrom(utxos)
                .complete();

            const signedTx = await wallet.signTx(unsignedTx!);
            const txHash = await wallet.submitTx(signedTx);

            // reset txbuilder
            meshTxBuilder?.reset();

            // remove below
            console.log(`${lockAdaAmount} tADA locked into the contract`);
            blockchainProvider?.onTxConfirmed(txHash!, () => {
                console.log("txHash:", txHash);
                setLockTxDetails(prevState => ({ ...prevState, txHash, datumList }));
                setLockTxHash(txHash);
                setLocking(false);
            });
        } catch (err) {
            // reset txbuilder
            meshTxBuilder?.reset();
            setLocking(false);
            console.log("err:", err);
        }
    }

    const upDateLockList = async () => {
        const { walletAddress } = await getWalletForTx(wallet);
        const { pubKeyHash } = deserializeAddress(walletAddress);

        const scriptAddr = (await validator).vestingAddress;
        const scriptUtxos = await blockchainProvider?.fetchAddressUTxOs(scriptAddr);

        const foundUtxos = scriptUtxos?.filter(utxo => {
            try {
                const datum = deserializeDatum<Datum>(utxo.output.plutusData!);
                // remove 2 lines below
                // console.log(`Datum txHash: ${utxo.input.txHash}`);
                // console.log(`Datum txHash: ${utxo.output.dataHash}`);
                return (datum.fields[1].bytes === pubKeyHash || datum.fields[2].bytes === pubKeyHash);
            } catch {
                return false;
            }
        });

        console.log("foundUtxos:", foundUtxos);
        setUtxoLockList(foundUtxos);
    };

    useEffect(() => {
        upDateLockList();
    }, [locking, lockTxHash, unlocking, unlockTxHash]);

    const handleUnlock = async (txHashForUnlock: string, beneficiary: string) => {
        setUnlocking(txHashForUnlock);

        try {
            const lockTxHashUtxos = await blockchainProvider?.fetchUTxOs(txHashForUnlock);

            const { walletAddress } = await getWalletForTx(wallet);
            const { pubKeyHash } = deserializeAddress(walletAddress);

            const unlockerUtxos = lockTxHashUtxos!.filter(utxo => {
                try {
                    const datum = deserializeDatum<Datum>(utxo.output.plutusData!);
                    return (datum.fields[1].bytes === pubKeyHash || (datum.fields[2].bytes === beneficiary && pubKeyHash === beneficiary));
                } catch {
                    return false;
                }
            });

            const { vestingValidatorScript, vestingAddress } = await validator;

            const txBuilder = meshTxBuilder;

            for (let i = 0; i < unlockerUtxos.length; i++) {
                try {
                    const { utxos, walletAddress, collateral } = await getWalletForTx(wallet);
                    const { input: collateralInput, output: collateralOutput } = collateral;
                    const { pubKeyHash } = deserializeAddress(walletAddress);

                    const utxo = unlockerUtxos[i];
                    const datum = deserializeDatum<Datum>(utxo.output.plutusData!);

                    const invalidBefore = unixTimeToEnclosingSlot(
                        (Date.now() - 45000),
                        SLOT_CONFIG_NETWORK.preprod
                    );

                    const unsignedTx = await txBuilder?.spendingPlutusScript("V3")
                        .txIn(
                            utxo.input.txHash,
                            utxo.input.outputIndex,
                            utxo.output.amount,
                            vestingAddress
                        )
                        .spendingReferenceTxInInlineDatumPresent()
                        .spendingReferenceTxInRedeemerValue("")
                        .txInScript(vestingValidatorScript)
                        // .txOut(walletAddress, [])
                        .txInCollateral(
                            collateralInput.txHash,
                            collateralInput.outputIndex,
                            collateralOutput.amount,
                            collateralOutput.address
                        )
                        .invalidBefore(invalidBefore)
                        .requiredSignerHash(pubKeyHash)
                        .changeAddress(walletAddress)
                        .selectUtxosFrom(utxos)
                        .complete();

                    const signedTx = await wallet.signTx(unsignedTx!, true);
                    const txHash = await wallet.submitTx(signedTx);

                    // reset txbuilder
                    meshTxBuilder?.reset();

                    blockchainProvider?.onTxConfirmed(txHash!, () => {
                        setUnlockTxHash(txHash);
                        // remove
                        console.log(`${lockAdaAmount} tADA unlocked!`);
                        setUnlocking(null);
                    });
                } catch (err) {
                    // reset txbuilder
                    meshTxBuilder?.reset();
                    setUnlocking(null);
                    console.log(err);
                }
            }
        } catch (err) {
            // reset txbuilder
            meshTxBuilder?.reset();
            setUnlocking(null);
            console.log(err);
        }
    };

    return <>
        <h2 className="mt-10 text-lg font-bold">Vest ADA</h2>

            <Input
                type="text"
                name="lockAdaAmount"
                id="lockAdaAmount"
                value={lockAdaAmount}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setLockAdaAmount(e.currentTarget.value)}
                className="block w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
                Ada Amount to Vest
            </Input>

            <label
                htmlFor="lockDuration"
                className="block mt-4 mb-3 text-sm font-medium text-gray-700"
            >Vesting Duration</label>
            <select
                id="lockDuration"
                value={lockDuration}
                onChange={e => setLockDuration(e.currentTarget.value)}
                className="bg-gray-50 my-4 block border rounded-md h-8 text-black"
            >
                <option value=""></option>
                {lockDurationOptions}
            </select>

            <Input
                type="text"
                name="lockAdaAddresses"
                id="lockAdaAddresses"
                value={lockAdaAddresses}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setLockAdaAddresses(e.currentTarget.value)}
                className="block w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
                Addresses to distribute ADA to (comma separated)
            </Input>

            <Button
                className="my-4"
                onClick={handleLock}
                disabled={locking}
            >
                {locking ? "Vesting..." : "Vest"}
            </Button>

            {lockTxDetails.txHash &&
                <div className="mb-8 mt-4 text-center">
                    <p><span className="font-semibold">ADA locked!;</span> Transaction hash: <a
                        target="_blank"
                        className="text-blue-400"
                        href={`https://preprod.cardanoscan.io/transaction/${lockTxDetails.txHash}`}
                    >{lockTxDetails.txHash}</a></p>
                    <p>Datum(s): <br /> {lockTxDetails.datumList.map((datum, key) => (
                        <pre key={key} className="bg-gray-200 p-2 rounded overflow-auto max-w-screen-sm">{JSON.stringify(datum)}</pre>
                    ))}</p>
                </div>
            }

            {!!utxoLockList?.length &&
                (<>
                    <h2 className="mt-4 text-lg font-semibold">List of Locked ADA</h2>
                    {unlockTxHash && 
                        <p>ADA Unlocked!; Transaction hash: <a
                            target="_blank"
                            className="text-blue-400 my-3"
                            href={`https://preprod.cardanoscan.io/transaction/${unlockTxHash}`}
                        >{unlockTxHash}</a></p>
                    }
                    <div className="mt-2">
                        {utxoLockList.map((utxo, key) => {
                            const datum = deserializeDatum<Datum>(utxo.output.plutusData!);

                            let timeLeftMins = (Number(datum.fields[0].int) - new Date().getTime()) / (1000 * 60);
                            timeLeftMins = timeLeftMins >= 0 ? timeLeftMins : 0
                            timeLeftMins = Number(timeLeftMins.toFixed(3));

                            console.log(`key: ${key}`);

                            return (
                                <p key={key} className="flex flex-row gap-6 mt-2 align-middle">
                                    <div>Amount locked: {(Number(utxo.output.amount[0].quantity) / 1000000).toFixed(2)} tADA</div>
                                    <div>Time left: {timeLeftMins} mins</div>
                                    <div>Address's pubKeyHash locked to: {datum.fields[2].bytes}</div>
                                    <div>
                                        <Button
                                            onClick={() => handleUnlock(utxo.input.txHash, datum.fields[2].bytes)}
                                            id={String(key)}
                                            disabled={!!timeLeftMins || unlocking === utxo.input.txHash}
                                            className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 disabled:bg-gray-400 disabled:text-gray-800"
                                        >
                                            {unlocking === utxo.input.txHash ? "Unlocking..." : "Unlock"}
                                        </Button>
                                    </div>
                                </p>
                        )})}
                    </div>
                </>)
            }
    </>
}
