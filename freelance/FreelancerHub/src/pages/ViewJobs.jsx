import React, { useContext, useEffect, useState } from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { AccountContext } from '../context/AccountProvider'
import jobs from '../assets/freelancer.json'
import toast from 'react-hot-toast'

const ViewJobs = () => {
  
    const {id} = useParams()
    const {publicClient,account,client} = useContext(AccountContext)
    const [data,setData] = useState('')
    const navigate = useNavigate()

    const loadData = async () => {
    try {
      const result = await publicClient.readContract({
        address: jobs.ContractAddress,
        abi: jobs.abi,
        functionName: "getJob",
        args: [id],
      });
      setData(result)
      console.log(result)
      
      
    } catch (error) {
      console.error("fetching faild", error);
    }
  };

  useEffect(()=>{
    loadData()
  },[id])

  const apply = async()=>{
    if(!account){
       alert('Plz connect Metamask ')
    
    }
    
   try {
     const hash = await client.writeContract({
      address: jobs.ContractAddress,
      abi: jobs.abi,
      functionName: "applyJob",
      args: [id],
      account: account,
    });  
        await publicClient.waitForTransactionReceipt({ hash });
         toast.success("Successfully applied!");
    navigate('/dashboard');
   } catch (error) {
    toast.error("Already applied or failed");
    console.error(error);
   }
    
  }

  
 

  return (
    <div className="max-w-xl mx-auto mt-[80px] border border-gray-200 shadow-lg rounded-2xl p-6 bg-white text-[#3e454f]">


  <h1 className="text-2xl font-semibold text-[#3B82F6]">
    {data[0]}
  </h1>


  <div className="flex items-center gap-6 mt-3 text-sm">
    <p>
      <span className="font-semibold">Budget:</span> {data[2]} ETH
    </p>
    <p>
      <span className="font-semibold">Status:</span>{" "}
      <span className="text-green-600 font-medium">Open</span>
    </p>
  </div>


  <p className="mt-4 leading-relaxed text-[15px]">
    {data[1]}
  </p>


  <h2 className="font-semibold text-lg mt-6">Tools & Technologies</h2>
  <div className="flex flex-wrap gap-3 mt-2">
    {data[3]?.map((item, index) => (
      <span
        key={index}
        className="px-4 py-1 bg-[#E0F2FE] text-[#0369A1] border border-[#38bdf8] rounded-full text-sm"
      >
        {item}
      </span>
    ))}
  </div>


  {/* <h2 className="font-semibold text-lg mt-8">Applicants</h2>
  <div className="mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
    <p className="text-sm text-gray-500">No applicants yet</p>
  </div> */}


  <button className="w-full mt-6 bg-[#28b9ed] hover:bg-[#0fa3d1] transition-all text-white p-3 rounded-xl font-medium text-[16px]"
  onClick={apply}>
    Apply
  </button>

</div>

  )
}

export default ViewJobs