import { createContext, useState } from "react";
import toast from "react-hot-toast";
import { createPublicClient, createWalletClient, custom } from "viem";
import { hardhat } from "viem/chains";

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const [account, setAccount] = useState("");

    const client = createWalletClient({
      chain:hardhat,
      transport:custom(window.ethereum),
    })

     const publicClient = createPublicClient({
    chain: hardhat,
    transport:custom(window.ethereum),
  });

      const connectWallet = async ()=>{
        try {
          const [addr]= await window.ethereum.request({method:"eth_requestAccounts"})
          toast.success("Metamask connected")
          setAccount(addr)
          console.log(addr);
          
          
        } catch (error) {
          console.log("Faild to connect wallet",error);
          toast.error("Metamask connection faild")
          
        }
      }

      const disconnectWallet = () => {
        setAccount(""); // Clear the account address in state
        toast.success("Wallet disconnected");
    };

    const writeContract = async ({ address, abi, functionName, args }) => {
        if (!account) {
            toast.error("Please connect your wallet first.");
            return;
        }
        
        try {
            // Viem's built-in writeContract function that uses the Wallet Client (`client`)
            const hash = await client.writeContract({
                address,
                abi,
                functionName,
                args,
                account, // The connected account is the sender (signer)
            });

            toast.promise(
                publicClient.waitForTransactionReceipt({ hash }),
                {
                    loading: 'Transaction pending...',
                    success: 'Transaction confirmed!',
                    error: (err) => `Transaction failed: ${err.message || 'Check console'}`,
                }
            );

            // Return the hash immediately so the calling function can track it
            return hash; 

        } catch (error) {
            console.error("writeContract error:", error);
            // Show user-friendly error from the transaction
            const reason = error.shortMessage || "Transaction failed";
            toast.error(reason);
            throw error; // Re-throw to handle it in the component
        }
    };

  return (
    <AccountContext.Provider value={{ account, setAccount,client,connectWallet,publicClient,disconnectWallet,writeContract}}>
      {children}
    </AccountContext.Provider>
  );
};
