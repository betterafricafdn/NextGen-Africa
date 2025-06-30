import Head from "next/head";
import { CardanoWallet, MeshBadge, useWallet } from "@meshsdk/react";
import { useState } from "react";
import Vesting from "./vesting";
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";

export default function Home() {
  const [meshTxBuilder, setMeshTxBuilder] = useState<MeshTxBuilder | null>(null);
  const [blockchainProvider, setBlockchainProvider] = useState<BlockfrostProvider>();
  const { connected, wallet  } = useWallet();

    const setUpMesh = () => {
        const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_KEY;
        if (!blockfrostKey) throw new Error("You need to provide a blockfrost API key");

        setBlockchainProvider(new BlockfrostProvider(blockfrostKey));

        const txBuilder = new MeshTxBuilder({
            fetcher: blockchainProvider,
            submitter: blockchainProvider
        });
        txBuilder.setNetwork("preprod");

        setMeshTxBuilder(txBuilder);

        // log to be removed
        console.log("Mesh Tx Builder:");
        console.log(txBuilder);
        console.log(meshTxBuilder);

        console.log("wallet:", wallet);
    };

  return (
    <div className="w-full text-white text-center bg-gray-500">
      <Head>
        <title>Mesh App on Cardano</title>
        <meta name="description" content="A Cardano dApp powered my Mesh" />
      </Head>
      <main
        className={`flex min-h-screen flex-col items-center justify-center p-24`}
      >
        <h1 className="text-6xl font-thin mb-20">
          <a href="https://meshjs.dev/" className="text-sky-600">
            NextGen
          </a>{" "}
          Vesting
        </h1>

        <div>
          <CardanoWallet onConnected={setUpMesh} />
        </div>

        {connected && (
            <Vesting meshTxBuilder={meshTxBuilder} blockchainProvider={blockchainProvider} wallet={wallet} />
        )}

      </main>
      <footer className="p-8 border-t border-gray-300 flex justify-center">
        <MeshBadge isDark={true} />
      </footer>
    </div>
  );
}
