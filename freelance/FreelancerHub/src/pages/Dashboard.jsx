  import React, { useContext, useEffect, useState } from "react";
  import { AccountContext } from "../context/AccountProvider";
  import jobs from '../assets/freelancer.json'
  // import { hexToString } from "viem";
  // import { decodeEventLog, hexToString } from "viem";
   import { decodeEventLog, hexToString } from "viem";
  const Dashboard = () => {

    const {publicClient,account,writeContract} =useContext(AccountContext)
    const [appliedJobs,setAppliedJobs]=useState()
    const [myPostedJobs, setMyPostedJobs] = useState([]);

  useEffect(() => {
    if (account){ loadApplied()
      loadMyPostedJobs()
    };
  }, [account]);

 // Dashboard.jsx - CORRECTED loadApplied function

// Dashboard.jsx

const loadApplied = async () => {
    try {
      // 1️⃣ Get list of job IDs the user applied to
      const ids = await publicClient.readContract({
        address: jobs.ContractAddress,
        abi: jobs.abi,
        functionName: "getAppliedJobs",
        args: [account],
      });

      console.log("Applied job IDs:", ids);

      // 2️⃣ Fetch full job details of each ID
      const appliedDetails = [];

      for (let id of ids) {
        // 🚨 FIX: 'id' is already a plain string (UUID), no hexToString needed.

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
          args: [id, account], // Pass job ID and the current applicant's address
        });

        // Convert the status number (0: Pending, 1: Accepted, 2: Rejected) to a readable string
        const statusMap = { 0: "Pending", 1: "Accepted", 2: "Rejected" };
        const status = statusMap[Number(statusRaw)];

        appliedDetails.push({
          id,
          title: job[0],
          description: job[1],
          budget: job[2],
          tools: job[3],
          status, // CRITICAL: Now the status is included
        });
      }

      // 3️⃣ Save the final structured list
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

    const result = [];

    const normalize = (str) => String(str).trim();

    // 1️⃣ Get all Applied event logs
    const logs = await publicClient.getLogs({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      eventName: "Applied",
      fromBlock: 0n,
      strict: true,
    });

    const applicantsByJob = {};

   logs.forEach((log) => {
    const decoded = decodeEventLog({
        abi: jobs.abi,
        data: log.data,
        topics: log.topics,
        eventName: "Applied",
    });

    // 💡 FIX: Access arguments using the 'args' property
    const user = decoded.args.user;
    const jobId = normalize(decoded.args.jobId);
    
    // Safety check (log the full decoded structure for inspection)
    console.log('--- Full Decoded Log ---', decoded); 
    
    console.log(user, 'user');
    console.log(jobId, 'job id');
    
    if (!applicantsByJob[jobId]) applicantsByJob[jobId] = [];
    applicantsByJob[jobId].push(user);
});

    // 2️⃣ Load posted jobs
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

      result.push({
        id: jobId,
        title: job[0],
        description: job[1],
        budget: job[2],
        tools: job[3],
        applicants: applicantsByJob[jobId] ?? [],
      });
    }

    setMyPostedJobs(result);
    console.log("My Posted Jobs:", result);
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


const handleComplete = async (jobId) => {
  try {
    const tx = await writeContract({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      functionName: "markCompleted",
      args: [jobId],
    });

    console.log("Completed flag set:", tx);
  } catch (error) {
    console.error("Error setting complete flag:", error);
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
                      {
                        job.status === "Accepted"?(
                          <td className="p-4">
                        <button className="w-full px-3 py-1 bg-green-400 hover:bg-green-600 
                 text-white text-xs rounded-lg transition" onClick={() => handleComplete(job.id)}>Complete</button>
                      </td>
                        ):''
                      }

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
            <td className="p-4">
              {job.title}
            </td>

            {/* Applicant Names only */}
            <td className="p-4">
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
                {job.applicants && job.applicants.length > 0 ? job.applicants.map((applicant, i) => (
                  <div key={i} className="text-gray-800 text-sm truncate">
                    {applicant}
                  </div>
                )):(
                  <div className="text-gray-500 text-sm">No applicants yet</div>
                )}
              </div>
            </td>

            {/* Approve buttons inside Status/Actions column */}
            <td className="p-4">
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scroll">
               
{job.applicants.map((applicant) => (
  <div className="flex gap-2" key={applicant}> 
    <button
    onClick={() => handleApprove(job.id, applicant)} // Assuming job.id is the correct job ID property
    className="w-full px-3 py-1 bg-green-500 hover:bg-green-600 
               text-white text-xs rounded-lg transition"
    >
      Approve
    </button>

    <button
      onClick={() => handleReject(job.id, applicant)}
      className="w-full px-3 py-1 bg-red-400 hover:bg-red-600 
                 text-white text-xs rounded-lg transition"
    >
      Cancel
    </button>
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
