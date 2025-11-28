import React, { useContext, useState } from "react";
import { AccountContext } from "../context/AccountProvider";
import jobs from '../assets/freelancer.json'
import toast from "react-hot-toast";




const techOptions = [
  "React",
  "Tailwind",
  "Node.js",
  "MongoDB",
  "Ethereum",
  "Solidity",
  "Responsive Design",
  "Express.js",
];


const PostJobs = () => {
   const { account,client } =useContext(AccountContext)
  const [selectedTech, setSelectedTech] = useState([]);
  const [title,settitle]=useState()
  const [description,setDescription] =useState()
  const [budget,setBudget]=useState()

  const toggleTech = (item) => {
    if (selectedTech.includes(item)) {
      setSelectedTech(selectedTech.filter((t) => t !== item));
    } else {
      setSelectedTech([...selectedTech, item]);
    }
  };

const handlesubmit =async(e)=>{
  e.preventDefault()
  if(account){
    if(!selectedTech || !title || !description || !budget){
      console.log(title,description,budget,selectedTech);
      return alert("Please fill in all fields");
    }
    try {
      const id = crypto.randomUUID();

   console.log(title,description,budget,id,selectedTech);
   const tx = await client.writeContract({
    address: jobs.ContractAddress,
    abi: jobs.abi,
    functionName: "posting",
    args:[
      id,
      title,
      description,
      budget,
      selectedTech
    ],
    account:account
   })
   console.log(tx);
   
   toast.success("Job posted successfuly")
   setBudget("");
setDescription("");
setSelectedTech([]);
settitle("");
    } catch (error) {
      toast.error("Somthing went wrong")
      console.log(error);  
    }
  }
  else{
    alert("plz connect Metamask")
  }

}

  return (
    <div className="max-w-2xl mx-auto mt-[80px] p-8 bg-white shadow-lg rounded-xl border">

      
      <h1 className="text-3xl font-semibold text-[#3B82F6] mb-6">
        Post a New Job
      </h1>

      
      <form action="" onSubmit={handlesubmit}>
        <div className="flex flex-col gap-5">

        
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            placeholder="e.g., Build React Landing Page"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            value={title}
            onChange={(e)=>settitle(e.target.value)}
          />
        </div>

        
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe the project and requirements..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
          ></textarea>
        </div>

        
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Budget (ETH)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.2"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            value={budget}
            onChange={(e)=>setBudget(e.target.value)}
          />
        </div>

        
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Required Skills / Tools
          </label>

          <div className="flex flex-wrap gap-3">
            {techOptions.map((item, index) => (
              <button
                type="button"
                key={index}
                onClick={() => toggleTech(item)}
                className={`px-4 py-2 rounded-full border 
                  ${
                    selectedTech.includes(item)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }
                  transition`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        
        <button className="w-full bg-[#28b9ed] hover:bg-[#0fa3d1] text-white p-3 rounded-xl font-semibold text-lg transition">
          Post Job
        </button>
      </div>
      </form>
      
    </div>
  );
};

export default PostJobs;
