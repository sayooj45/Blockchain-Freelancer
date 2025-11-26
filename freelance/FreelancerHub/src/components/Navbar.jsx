import React, {  useContext, useState} from 'react'
import logo from '../assets/images/freelancerLogo1.png'
import { NavLink } from 'react-router-dom'
import { AccountContext } from '../context/AccountProvider'
import token from '../assets/images/token.png'


const Navbar = () => {

   const { account, setAccount ,connectWallet} = useContext(AccountContext);

  return (

    <div className='bg-[#F8FAFC] flex items-center justify-between p-5 shadow-lg'>        
            <img className='h-[50px] ' src={logo} alt="logo" />
        <ul className='flex text-[#3e454f] text-[20px] font-semibold'>
            <li className='p-2'><NavLink className={({isActive})=>`hover:underline hover:text-[#28b9ed] transition-all duration-300 ${isActive? 'underline text-[#28b9ed]':' text-[#1E293B]'}`} to='/'>Home</NavLink></li>
            <li className='p-2 '><NavLink className={({isActive})=>`hover:underline hover:text-[#28b9ed] transition-all duration-300 ${isActive? 'underline text-[#28b9ed]':' text-[#1E293B]'}`} to='/postJobs'>Post Jobs</NavLink></li>
            {account?(
              <div className="">
                <span className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-1 rounded-xl shadow-sm border border-gray-200">
                  <span className="font-semibold text-gray-800">10</span>
                  <img src={token} className="h-5 w-5" />
                </span>
              </div>
            ):''}
            <li className='p-2'><NavLink className={({isActive})=>`hover:underline  hover:text-[#28b9ed] transition-all duration-300${isActive? 'underline text-[#28b9ed]':' text-[#1E293B]'}`} to='/dashboard'>Dashboard</NavLink></li>
            <li className=''><button className='bg-[#3B82F6] text-white p-2 rounded-lg hover:bg-[#0a63f5] transition-all duration-300' onClick={connectWallet}>
              {account?`${account.slice(0,6)}...${account.slice(-4)}`:"Connect to Wallet"}</button></li>
        </ul>
        
    </div>
 
  )
}

export default Navbar
