  import React, { useContext, useEffect, useState } from "react";
  import { AccountContext } from "../context/AccountProvider";
  import jobs from '../assets/freelancer.json'
  // import { hexToString } from "viem";
  // import { decodeEventLog, hexToString } from "viem";
  //  import { decodeEventLog, hexToString } from "viem";
   import { decodeEventLog, hexToString, parseEther } from "viem"; // Make sure parseEther is included
  const Dashboard = () => {

    const {publicClient,account,writeContract} =useContext(AccountContext)
    const [appliedJobs,setAppliedJobs]=useState()
    const [myPostedJobs, setMyPostedJobs] = useState([]);
    const [completed,setCompleted] =useState(false)
    const [completedJobs, setCompletedJobs] = useState([]);

  useEffect(() => {
    if (account){ loadApplied()
      loadMyPostedJobs()
    };
  }, [account]);

 // Dashboard.jsx - CORRECTED loadApplied function

// Dashboard.jsx

// Dashboard.jsx - Corrected loadApplied function

const loadApplied = async () => {
    try {
      // 1️⃣ CRITICAL: Get list of job IDs the user applied to
      const ids = await publicClient.readContract({ // <--- ids is defined here!
        address: jobs.ContractAddress,
        abi: jobs.abi,
        functionName: "getAppliedJobs",
        args: [account],
      });

      console.log("Applied job IDs:", ids);

      // 2️⃣ Fetch full job details of each ID
      const appliedDetails = [];
      const statusMap = { 0: "Pending", 1: "Accepted", 2: "Rejected" };


      for (let id of ids) { // <--- If 'ids' is undefined, the code fails here
        
        // Fetch base job details
        const job = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "getJob",
          args: [id],
        });

        // 💡 Fetch the application status from the contract
        const statusRaw = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "getApplicationStatus",
          args: [id, account],
        });
        const status = statusMap[Number(statusRaw)];

        // 💡 CRITICAL FIX: Check if this job has been completed by the current user
        const isCompletedInContract = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "isJobCompleted", // Public mapping from your contract
          args: [id],
        });

        appliedDetails.push({
          id,
          title: job[0],
          description: job[1],
          budget: job[2],
          tools: job[3],
          status, 
          isCompleted: isCompletedInContract, // Used to show 'Submitted' button
        });
      }

      // 3️⃣ Save the final structured list
      setAppliedJobs(appliedDetails);

      console.log("Full applied job details:", appliedDetails);
    } catch (error) {
      // If the error happens, it will be caught here
      console.error("Error loading applied jobs:", error);
    }
  };





// Dashboard.jsx - CORRECTED loadMyPostedJobs

// Dashboard.jsx - Full Corrected loadMyPostedJobs function

const loadMyPostedJobs = async () => {
    try {
        // 1. Get the total number of jobs posted to iterate through jobIds
        const total = await publicClient.readContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "totalJobs",
        });

        // 2. Fetch all completed jobs data for quick lookups
        const allCompletedJobs = await publicClient.readContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "getAllCompletedJobs",
        });

        // Helper function to check if a specific user completed a specific job
        const checkCompletion = (jId, userAddress) => {
            if (!allCompletedJobs) return false;
            // Iterate over the CompletedJobData[] array
            return allCompletedJobs.some((c) => 
                // Note: Using object properties returned by viem (c.jobId, c.freelancer)
                c.jobId === jId &&
                c.freelancer.toLowerCase() === userAddress.toLowerCase()
            );
        };
        
        const statusMap = { 0: "Pending", 1: "Accepted", 2: "Rejected" };
        const result = [];
        const normalize = (str) => String(str).trim();

        // 3. Get all Applied event logs to find all applicants for every job
        const logs = await publicClient.getLogs({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            eventName: "Applied",
            fromBlock: 0n, // Start from the genesis block
            strict: true,
        });

        const applicantsByJob = {};

        logs.forEach((log) => {
            try {
                const decoded = decodeEventLog({
                    abi: jobs.abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "Applied",
                });
    
                const user = decoded.args.user;
                const jobId = normalize(decoded.args.jobId);
    
                // CRITICAL FIX: Skip if the user address is invalid/undefined
                if (!user) { 
                    console.warn(`Skipping event log for job ${jobId}: User address is invalid or undefined.`);
                    return;
                }
    
                if (!applicantsByJob[jobId]) applicantsByJob[jobId] = [];
                // Avoid duplicates and filter out the job poster if they accidentally applied
                if (!applicantsByJob[jobId].includes(user)) {
                    applicantsByJob[jobId].push(user);
                }
            } catch (error) {
                 console.error("Error decoding Applied log:", error);
            }
        });

        // 4. Iterate over all job IDs and process only the ones posted by the current account
        for (let i = 0; i < Number(total); i++) {
            const jobIdRaw = await publicClient.readContract({
                address: jobs.ContractAddress,
                abi: jobs.abi,
                functionName: "jobIds",
                args: [i],
            });

            const jobId = normalize(jobIdRaw);

            const owner = await publicClient.readContract({
                address: jobs.ContractAddress,
                abi: jobs.abi,
                functionName: "jobOwner",
                args: [jobId],
            });

            // Skip if the current user is not the owner
            if (owner.toLowerCase() !== account.toLowerCase()) continue;

            const job = await publicClient.readContract({
                address: jobs.ContractAddress,
                abi: jobs.abi,
                functionName: "getJob",
                args: [jobId],
            });
            
            // Filter out any invalid addresses again, just in case
            const validApplicants = (applicantsByJob[jobId] ?? []).filter(app => !!app);
            
            // 5. Fetch status and completion for each valid applicant concurrently
            const applicantPromises = validApplicants.map(async (app) => {
                const statusRaw = await publicClient.readContract({
                    address: jobs.ContractAddress,
                    abi: jobs.abi,
                    functionName: "getApplicationStatus",
                    args: [jobId, app],
                });
                
                return {
                    address: app,
                    // Check completion using the local helper
                    isCompleted: checkCompletion(jobId, app), 
                    status: statusMap[Number(statusRaw)], // Convert enum number (0, 1, 2) to string
                };
            });

            const applicantsWithStatus = await Promise.all(applicantPromises); // Wait for all status calls

            result.push({
                id: jobId,
                title: job[0],
                description: job[1],
                budget: job[2],
                tools: job[3],
                applicants: applicantsWithStatus,
            });
        }

        setMyPostedJobs(result);
        console.log("My Posted Jobs with Status:", result);
    } catch (error) {
        console.error("Error loading posted jobs:", error);
    }
};

const handleApprove = async (jobId, applicantAddress) => {
  try {
      // 1 is the enum value for ApplicationStatus.Accepted in the Solidity contract
      const statusAccepted = 1;
  const hash = await writeContract({
    address: jobs.ContractAddress,
    abi: jobs.abi,
    functionName: "updateApplicationStatus",
    args: [jobId, applicantAddress, statusAccepted], // 1 for Accepted
  });

  console.log("Approval Transaction Hash:", hash);

      // 💡 OPTIONAL: Wait for the transaction to be mined and reload data
      // await publicClient.waitForTransactionReceipt({ hash });
      // loadMyPostedJobs(); // Reload the job list to see the update
    } catch (error) {
      console.error("Error approving applicant:", error);
    }
}

const handleReject = async (jobId, applicantAddress) => {
  try {
    const statusRejected = 2; // enum 2 = Rejected

    const tx = await writeContract({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      functionName: "updateApplicationStatus",
      args: [jobId, applicantAddress, statusRejected],
    });

    console.log("Rejected Tx:", tx);

    // OPTIONAL:
    // await publicClient.waitForTransactionReceipt({ hash: tx });
    // loadMyPostedJobs();

  } catch (error) {
    console.error("Error rejecting applicant:", error);
  }
};


// const handleComplete = async (jobId) => {
//   try {
//     const tx = await writeContract({
//       address: jobs.ContractAddress,
//       abi: jobs.abi,
//       functionName: "markCompleted",
//       args: [jobId],
//     });

//     console.log("Completed flag set:", tx);
//     setCompleted(true)
//   } catch (error) {
//     console.error("Error setting complete flag:", error);
//   }
// };

// Dashboard.jsx

const handleComplete = async (jobId) => {
  try {
    console.log(`Completing job: ${jobId}...`);

    const tx = await writeContract({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      functionName: "completeJob", 
      args: [jobId],
    });

    console.log("Job Completion Tx Hash:", tx);

    // 💡 CRITICAL: Wait for the transaction to be confirmed
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`Transaction for job ${jobId} confirmed.`);
    
    // 💡 CRITICAL: Reload both freelancer's and client's data to reflect the change
    loadApplied(); 
    loadMyPostedJobs(); 

    // REMOVE THE OLD LOCAL STATE UPDATE LOGIC:
    // const updatedJobs = appliedJobs.map((job) => 
    //   job.id === jobId ? { ...job, isCompletedLocally: true } : job
    // );
    // setAppliedJobs(updatedJobs); 

  } catch (error) {
    console.error("Error completing job:", error);
    alert("Transaction failed or you are not authorized to complete this job.");
  }
};


const handleAcceptWork = async (jobId, applicantAddress) => {
    console.log("Accepting work and initiating payment for:", jobId, "from:", applicantAddress);

    // Assuming 'account' is your connected address (addr equivalent)
    if (!account) {
        alert("Connect wallet to finalize payment.");
        return;
    }

    const jobDetails = myPostedJobs.find(job => job.id === jobId);
    if (!jobDetails) {
        alert("Job details not found. Please refresh.");
        return;
    }
    
    // 2. Convert budget (string) to Wei (BigInt)
    let paymentValueWei;
    try {
        paymentValueWei = parseEther(jobDetails.budget); 
        console.log(`Parsed Budget: ${jobDetails.budget} ETH = ${paymentValueWei.toString()} Wei`);
    } catch (e) {
        console.error("Error parsing budget. Budget value:", jobDetails.budget, e);
        alert("Invalid budget format. Cannot initiate payment.");
        return;
    }

    try {
        // --- STEP 1: SIMULATE TRANSACTION (Good for early error checks) ---
        // We use simulation primarily for checking gas and contract logic (require statements)
        await publicClient.simulateContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "acceptWorkAndPay",
            args: [jobId, applicantAddress],
            value: paymentValueWei,
            account: account, 
        });
        
        console.log("Transaction simulation successful.");

        // --- STEP 2: SEND TRANSACTION (THE CRITICAL PART) ---
        // Pass arguments directly to the writeContract helper.
        // This structure is guaranteed to pass the value.
        const txHash = await writeContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "acceptWorkAndPay",
            args: [jobId, applicantAddress],
            value: paymentValueWei, // 🌟 FIX: Explicitly pass the value as a separate parameter
            account: account,       // Explicitly pass the sender account
        });

        console.log("Payment Transaction Hash (Sent to Wallet):", txHash);
        alert(`Payment initiated! Please confirm the transaction in your wallet. Hash: ${txHash}`);

        // --- STEP 3: WAIT FOR CONFIRMATION ---
        console.log("Waiting for transaction confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        if (receipt.status === 'success') {
             console.log("Job finalized and payment confirmed.");
             alert("Success! The job is finalized and the payment has been confirmed on-chain.");
             loadMyPostedJobs(); // Reload the client's dashboard to update the status 
        } else {
             // If the transaction reverts on-chain, it should be caught, but this is a failsafe.
             throw new Error("Transaction was mined but failed (reverted).");
        }

    } catch (error) {
        console.error("Error accepting work (payment failed):", error);
        
        // This provides better developer/user feedback.
        const errorMessage = error.message || String(error);
        
        if (errorMessage.includes("insufficient funds")) {
            alert("Payment failed: Insufficient funds in your wallet to cover the job budget and gas fees.");
        } else if (errorMessage.includes("execution reverted") || errorMessage.includes("revert")) {
            alert("Payment failed (Contract Revert). Possible issues: Budget too large, job not completed, or already paid.");
        } else {
            // This is the error if the Wallet connection or RPC failed.
            alert(`Transaction failed. Check console for details. Error: ${errorMessage}`);
        }
    }
};


    

    return (
      <div className="flex  ">


        
        <div className="flex-1 p-8">

          
          <h1 className="text-2xl font-semibold text-gray-800">Welcome back 👋</h1>
          <p className="text-gray-500">Here’s what’s happening today.</p>

          
          <div className="grid grid-cols-3 gap-6 mt-8">
            
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm">Jobs Applied</h3>
              <p className="text-3xl font-bold text-blue-600">{appliedJobs?appliedJobs.length:0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm">Jobs Posted</h3>
              <p className="text-3xl font-bold text-green-600">{myPostedJobs?myPostedJobs.length:0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm">Active Applications</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {appliedJobs?.filter(j => j.status === "Pending").length}
              </p>
            </div>
          </div>

          
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Jobs I Applied</h2>

            <div className="bg-white rounded-xl shadow-sm overflow-auto h-[240px] p-4 custom-scroll">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-4 text-gray-600">Job Title</th>
                    <th className="p-4 text-gray-600">Budget</th>
                    <th className="p-4 text-gray-600">Status</th>
                    <th className="p-4 text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs?.map((job, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">{job.title}</td>
                      <td className="p-4">{job.budget}</td>
                      <td className="p-4">
                        <span
                className={`px-3 py-1 rounded-lg text-sm ${
                  // 👈 **USE job.status HERE**
                  job.status === "Accepted"
                    ? "bg-green-100 text-green-700"
                    : job.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {job.status} {/* 👈 **DISPLAY job.status HERE** */}
              </span>
                      </td>
                      {job.status === "Accepted" ? (
  <td className="p-4">
    {/* 💡 Use the new isCompleted flag from the contract */}
    {job.isCompleted ? (
      <div className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded-lg text-center cursor-default">
        Submitted
      </div>
    ) : (
      <button
        className="w-full px-3 py-1 bg-green-400 hover:bg-green-600 text-white text-xs rounded-lg transition"
        onClick={() => handleComplete(job.id)}
      >
        Complete
      </button>
    )}
  </td>
) : (
  <td className="p-4"></td> 
)}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
          <div className="mt-10">
  <h2 className="text-xl font-semibold text-gray-800 mb-3">Jobs I Posted</h2>

  <div className="bg-white rounded-xl shadow-sm overflow-auto h-[220px] p-4 custom-scroll">
    <table className="w-full border-collapse ">
      <thead>
        <tr className="bg-gray-50 text-left ">
          <th className="p-4 text-gray-600 ">Job Title</th>
          <th className="p-4 text-gray-600">Applicants</th>
          <th className="p-4 text-gray-600">Actions</th>
        </tr>
      </thead>

<tbody>
  {myPostedJobs.map((job, index) => (
    <tr key={index} className="border-t">
      {/* Job Title */}
      <td className="p-4">{job.title}</td>

      {/* Applicant Names */}
      <td className="p-4">
        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
          {job.applicants && job.applicants.length > 0 ? (
            job.applicants.map((applicant, i) => (
              <div key={i} className="text-gray-800 text-sm truncate">
                {/* 💡 Display address (and maybe a checkmark if done) */}
                {applicant.address} 
                {applicant.isCompleted && <span className="text-green-600 font-bold ml-2">✓</span>}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">No applicants yet</div>
          )}
        </div>
      </td>

      {/* Actions Column */}
<td className="p-4">
    <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
        {job.applicants.map((applicant) => (
            <div className="flex gap-2" key={applicant.address}>
                
                {applicant.status === "Accepted" && applicant.isCompleted ? (
                    // 1. Accepted AND Completed: Show Accept Work button
                    <button
                        onClick={() => handleAcceptWork(job.id, applicant.address)}
                        className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 
                                   text-white text-xs rounded-lg transition shadow-md"
                    >
                        Accept Work
                    </button>

                ) : applicant.status === "Pending" ? (
                    // 2. Pending: Show Approve/Cancel buttons
                    <>
                        <button
                            onClick={() => handleApprove(job.id, applicant.address)}
                            className="w-full px-3 py-1 bg-green-500 hover:bg-green-600 
                                       text-white text-xs rounded-lg transition"
                        >
                            Approve
                        </button>

                        <button
                            onClick={() => handleReject(job.id, applicant.address)}
                            className="w-full px-3 py-1 bg-red-400 hover:bg-red-600 
                                       text-white text-xs rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    // 3. Accepted (Not Completed) or Rejected: Show status message
                    <div className={`w-full px-3 py-1 text-xs rounded-lg text-center 
                                     ${applicant.status === "Accepted" ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {applicant.status}
                    </div>
                )}
            </div>
        ))}
    </div>
</td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
</div>


        </div>
      </div>
    );
  };

  export default Dashboard;
