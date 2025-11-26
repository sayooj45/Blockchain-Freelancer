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

  return (
    <AccountContext.Provider value={{ account, setAccount,client,connectWallet,publicClient}}>
      {children}
    </AccountContext.Provider>
  );
};
