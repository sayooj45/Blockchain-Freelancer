import React, { useContext, useEffect, useState } from 'react'
import ethLogo from '../assets/images/ethLogo.png'
import { Link } from 'react-router-dom'
import { AccountContext } from '../context/AccountProvider'
import jobsConfig from '../assets/freelancer.json'
const JobsCards = () => {
  const {account ,publicClient} = useContext(AccountContext)
  const [jobs,setJobs] = useState([])

  const loadData = async () => {
  try {
    const total = await publicClient.readContract({
      address: jobsConfig.ContractAddress,
      abi: jobsConfig.abi,
      functionName: "totalJobs",
      args: []
    });

    const allJobs = [];

    for (let i = 0; i < Number(total); i++) {
  const jobId = await publicClient.readContract({
    address: jobsConfig.ContractAddress,
    abi: jobsConfig.abi,
    functionName: "jobIds",
    args: [i]
  });

  const job = await publicClient.readContract({
    address: jobsConfig.ContractAddress,
    abi: jobsConfig.abi,
    functionName: "getJob",
    args: [jobId]
  });

  allJobs.push({
    id: jobId,
    title: job[0],
    description: job[1],
    budget: job[2],
    tools: job[3],
  });
}

setJobs(allJobs);


    console.log(allJobs,'all jobs');
    console.log(jobs,'jobs');
    
  // setJobs(allJobs)

  } catch (error) {
    console.log(error);
  }
};


  useEffect(()=>{
    loadData()
  },[account])
  

  return (
    <>
    {
      jobs.map((data,index)=>(
        <div className='border border-[#28b9ed] rounded-lg p-5 mt-[50px]' key={index} >
        <h1 className='text-[#3e454f] font-semibold text-[24px]'>{data.title}</h1>
        <p className='text-[#3e454f]'>{data.description}</p>
        <div className='flex justify-between mt-[20px]'>
            <div className='flex'>
                <img src={ethLogo} alt="logo" className='h-[20px]'/>
                <span className='ml-[10px] font-bold'>{data.budget} ETH</span>
            </div>
            <button className="bg-[#28b9ed] p-2 rounded-lg text-white hover:bg-[#0988b8]">
              <Link to={`job/${encodeURIComponent(data.id)}`} >View</Link>
            </button>
        </div>
    </div>
      ))
    }
    </>
  )
}

export default JobsCards