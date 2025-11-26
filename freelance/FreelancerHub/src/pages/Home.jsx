import React from 'react'
import Navbar from '../components/Navbar'
import JobsCards from '../components/JobsCards'

const Home = () => {
  return (
    <div className='mt-[50px] mx-[100px] '>
        <h1 className='text-[28px] font-bold text-[#3B82F6]'>Open Jobs</h1>
        <h2 className='text-[20px] font-normal text-[#3e454f] '>Browse open gigs. Connect your wallet to apply or get hired.</h2>
        <div className='h-[700px] overflow-y-auto custom-scroll scroll-smooth pr-4'>
          <JobsCards/>
        </div>
    </div>
  )
}

export default Home