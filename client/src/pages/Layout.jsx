import React, { useState } from 'react'
import Slidebar from '../components/Slidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'


const Layout = () => {

  const user  = useSelector((state)=>state.user.value)
  const [SidebarOpen, SetSidebarOpen] = useState(false)

  return user ? (

    <div className='w-full flex h-screen'>
      <Slidebar SidebarOpen={SidebarOpen} SetSidebarOpen={SetSidebarOpen}/>
      <div className='flex-1 bg-slate-100 '>
        <Outlet/>
      </div>
      {
        SidebarOpen ?
        <X className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-grey-600 sm:hidden' onClick={() => SetSidebarOpen(false)}/>
        :
        <Menu className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-grey-600 sm:hidden' onClick={() => SetSidebarOpen(true)}/>
      }
      </div>
  ) :(
    <Loading/>
  )
}

export default Layout