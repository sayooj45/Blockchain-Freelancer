  import React, { useContext, useEffect, useState } from "react";
  import { AccountContext } from "../context/AccountProvider";
  import jobs from '../assets/freelancer.json'

   import { decodeEventLog, parseEther } from "viem"; 
  const Dashboard = () => {

    const {publicClient,account,writeContract} =useContext(AccountContext)
    const [appliedJobs,setAppliedJobs]=useState()
    const [myPostedJobs, setMyPostedJobs] = useState([]);


  useEffect(() => {
    if (account){ loadApplied()
      loadMyPostedJobs()
    };
  }, [account]);


const loadApplied = async () => {
    try {
      
      const ids = await publicClient.readContract({ 
        address: jobs.ContractAddress,
        abi: jobs.abi,
        functionName: "getAppliedJobs",
        args: [account],
      });

      console.log("Applied job IDs:", ids);

      
      const appliedDetails = [];
      const statusMap = { 0: "Pending", 1: "Accepted", 2: "Rejected" };


      for (let id of ids) { 
        
        
        const job = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "getJob",
          args: [id],
        });

        
        const statusRaw = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "getApplicationStatus",
          args: [id, account],
        });
        const status = statusMap[Number(statusRaw)];

        
        const isCompletedInContract = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "isJobCompleted", 
          args: [id],
        });

        appliedDetails.push({
          id,
          title: job[0],
          description: job[1],
          budget: job[2],
          tools: job[3],
          status, 
          isCompleted: isCompletedInContract, 
        });
      }

      
      setAppliedJobs(appliedDetails);

      console.log("Full applied job details:", appliedDetails);
    } catch (error) {
      
      console.error("Error loading applied jobs:", error);
    }
  };







const loadMyPostedJobs = async () => {
    try {
        const total = await publicClient.readContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "totalJobs",
        });

        const allCompletedJobs = await publicClient.readContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "getAllCompletedJobs",
        });

        const checkCompletion = (jId, userAddress) => {
            if (!allCompletedJobs) return false;
            return allCompletedJobs.some((c) => 
                c.jobId === jId &&
                c.freelancer.toLowerCase() === userAddress.toLowerCase()
            );
        };
        
        const statusMap = { 0: "Pending", 1: "Accepted", 2: "Rejected" };
        const result = [];
        const normalize = (str) => String(str).trim();

        const logs = await publicClient.getLogs({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            eventName: "Applied",
            fromBlock: 0n, 
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
    
                
                if (!user) { 
                    console.warn(`Skipping event log for job ${jobId}: User address is invalid or undefined.`);
                    return;
                }
    
                if (!applicantsByJob[jobId]) applicantsByJob[jobId] = [];
                
                if (!applicantsByJob[jobId].includes(user)) {
                    applicantsByJob[jobId].push(user);
                }
            } catch (error) {
                 console.error("Error decoding Applied log:", error);
            }
        });

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

            if (owner.toLowerCase() !== account.toLowerCase()) continue;

            const job = await publicClient.readContract({
                address: jobs.ContractAddress,
                abi: jobs.abi,
                functionName: "getJob",
                args: [jobId],
            });
            
            const validApplicants = (applicantsByJob[jobId] ?? []).filter(app => !!app);
            
            // 5. Fetch status, completion, and PAID STATUS for each valid applicant concurrently
            const applicantPromises = validApplicants.map(async (app) => {
                const statusRaw = await publicClient.readContract({
                    address: jobs.ContractAddress,
                    abi: jobs.abi,
                    functionName: "getApplicationStatus",
                    args: [jobId, app],
                });
                
                // 💡 NEW: Check if the job has been paid to this freelancer
                const isPaid = await publicClient.readContract({
                    address: jobs.ContractAddress,
                    abi: jobs.abi,
                    functionName: "isJobPaid",
                    args: [jobId, app], // Job ID and Freelancer Address
                });

                return {
                    address: app,
                    isCompleted: checkCompletion(jobId, app), 
                    status: statusMap[Number(statusRaw)], 
                    isPaid: isPaid, // 💡 NEW: Include payment status
                };
            });

            const applicantsWithStatus = await Promise.all(applicantPromises); 

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
      const statusAccepted = 1;
  const hash = await writeContract({
    address: jobs.ContractAddress,
    abi: jobs.abi,
    functionName: "updateApplicationStatus",
    args: [jobId, applicantAddress, statusAccepted], 
  });

  console.log("Approval Transaction Hash:", hash);

    } catch (error) {
      console.error("Error approving applicant:", error);
    }
}

const handleReject = async (jobId, applicantAddress) => {
  try {
    const statusRejected = 2; 

    const tx = await writeContract({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      functionName: "updateApplicationStatus",
      args: [jobId, applicantAddress, statusRejected],
    });

    console.log("Rejected Tx:", tx);

   

  } catch (error) {
    console.error("Error rejecting applicant:", error);
  }
};




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

  
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`Transaction for job ${jobId} confirmed.`);
    
    loadApplied(); 
    loadMyPostedJobs(); 

    

  } catch (error) {
    console.error("Error completing job:", error);
    alert("Transaction failed or you are not authorized to complete this job.");
  }
};


const handleAcceptWork = async (jobId, applicantAddress) => {
    console.log("Initiating payment for job:", jobId, "to freelancer:", applicantAddress);

    if (!account) {
        alert("Connect wallet to finalize payment.");
        return;
    }

    const jobDetails = myPostedJobs.find(job => job.id === jobId);
    if (!jobDetails) {
        alert("Job details not found. Please refresh.");
        return;
    }
    
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
   
        const txHash = await writeContract({
            address: jobs.ContractAddress,
            abi: jobs.abi,
            functionName: "acceptWorkAndPay",
            args: [jobId, applicantAddress],
            value: paymentValueWei, 
            account: account,
        });

        console.log("Payment Transaction Hash (Sent to Wallet):", txHash);
        alert(`Payment initiated! Please confirm the transaction in your wallet. Hash: ${txHash}`);

        console.log("Waiting for transaction confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        if (receipt.status === 'success') {
             console.log("Job finalized and payment confirmed.");
             alert("Success! The job is finalized and the payment has been confirmed on-chain.");
             
             loadMyPostedJobs(); 
             loadApplied();
        } else {
 
             throw new Error("Transaction was mined but failed (reverted).");
        }

    } catch (error) {
        console.error("Error accepting work (payment failed):", error);
        
        const errorMessage = error.message || String(error);
        
        if (errorMessage.includes("insufficient funds")) {
            alert("Payment failed: Insufficient funds in your wallet to cover the job budget and gas fees.");
        } else if (errorMessage.includes("execution reverted") || errorMessage.includes("revert")) {
            alert("Payment failed (Contract Revert). Possible issues: Work not completed, job already paid, or wallet declined.");
        } else {
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
                  job.status === "Accepted"
                    ? "bg-green-100 text-green-700"
                    : job.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {job.status} 
              </span>
                      </td>
                      {job.status === "Accepted" ? (
  <td className="p-4">
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
      <td className="p-4">{job.title}</td>

      <td className="p-4">
        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
          {job.applicants && job.applicants.length > 0 ? (
            job.applicants.map((applicant, i) => (
              <div key={i} className="text-gray-800 text-sm truncate">
                {applicant.address} 
                {applicant.isCompleted && <span className="text-green-600 font-bold ml-2">✓</span>}
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">No applicants yet</div>
          )}
        </div>
      </td>

<td className="p-4">
    <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
        {job.applicants.map((applicant) => (
            <div className="flex gap-2" key={applicant.address}>
                
                {applicant.isPaid ? (
                    // 💰 NEW: Job is Paid
                    <div className="w-full px-3 py-1 bg-green-500 text-white text-xs rounded-lg text-center cursor-default">
                        PAID
                    </div>

                ) : applicant.status === "Accepted" && applicant.isCompleted ? (
                    // 1. Accepted AND Completed (AND NOT YET PAID): Show Accept Work button
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
