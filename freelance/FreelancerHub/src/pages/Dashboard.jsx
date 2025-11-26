  import React, { useContext, useEffect, useState } from "react";
  import { AccountContext } from "../context/AccountProvider";
  import jobs from '../assets/freelancer.json'
  import { hexToString } from "viem";
  const Dashboard = () => {

    const {publicClient,account} =useContext(AccountContext)
    const [appliedJobs,setAppliedJobs]=useState()
    const [myPostedJobs, setMyPostedJobs] = useState([]);

  useEffect(() => {
    if (account){ loadApplied()
      loadMyPostedJobs()
    };
  }, [account]);

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
        const job = await publicClient.readContract({
          address: jobs.ContractAddress,
          abi: jobs.abi,
          functionName: "getJob",
          args: [id],
        });

        appliedDetails.push({
          id,
          title: job[0],
          description: job[1],
          budget: job[2],
          tools: job[3],
        });
      }

      // 3️⃣ Save the final structured list
      setAppliedJobs(appliedDetails);

      console.log("Full applied job details:", appliedDetails);
    } catch (error) {
      console.log(error);
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

    for (let i = 0; i < Number(total); i++) {
      
      const jobIdRaw = await publicClient.readContract({
        address: jobs.ContractAddress,
        abi: jobs.abi,
        functionName: "jobIds",
        args: [i]
      });

      let jobId;
      if (typeof jobIdRaw === "string") {
        jobId = jobIdRaw;
      } else if (jobIdRaw?.hex) {
        jobId = hexToString(jobIdRaw.hex);
      } else {
        jobId = hexToString(jobIdRaw);
      }

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
      });
    }

    setMyPostedJobs(result);
    console.log("My Posted Jobs:", result);

  } catch (error) {
    console.log("Error:", error);
  }
};





    const postedJobs = [
      { title: "Web3 Portfolio Website", applicants: 3, status: "Open" },
      { title: "Responsive UI Upgrade", applicants: 1, status: "Closed" },
    ];

    return (
      <div className="flex  ">


        
        <div className="flex-1 p-8">

          
          <h1 className="text-2xl font-semibold text-gray-800">Welcome back 👋</h1>
          <p className="text-gray-500">Here’s what’s happening today.</p>

          
          <div className="grid grid-cols-3 gap-6 mt-8">
            
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm">Jobs Applied</h3>
              <p className="text-3xl font-bold text-blue-600">{appliedJobs?.length}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm">Jobs Posted</h3>
              <p className="text-3xl font-bold text-green-600">{postedJobs.length}</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Jobs I Posted</h2>

            <div className="bg-white rounded-xl shadow-sm overflow-auto h-[190px] p-4 custom-scroll">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-4 text-gray-600">Job Title</th>
                    <th className="p-4 text-gray-600">Applicants</th>
                    <th className="p-4 text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myPostedJobs.map((job, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">{job.title}</td>
                      <td className="p-4">{job.applicants}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm ${
                            job.status === "Open"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {job.status}
                        </span>
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
