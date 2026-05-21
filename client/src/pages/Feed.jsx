import React, { useEffect, useState } from 'react'
import Layout from './Layout'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import Postcard from '../components/Postcard'
import RecentMessages from '../components/RecentMessages'

const Feed = () => {
  const [feeds, setfeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const {getToken} = useAuth()

  const fetchFeeds = async () => {
    try {
      setLoading(true)
      const {data} = await api.get('/api/post/feed', {headers: { Authorization: `Bearer ${await getToken()}` }})

      if (data.success){
        setfeeds(data.posts)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFeeds()
  })
  return !loading ? (
    <div className='h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex items-start justify-center xl:gap-8'>
      <div>
        <StoriesBar />
        <div className='p-4 space-y-6'>
          {feeds.map((post) => (
            <Postcard key={post._id} post={post} />
          ))}
        </div>
      </div>
      {/* marketing */}
      <div className='max-xl:hidden sticky top-0'>
        {/* <div className='max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow'>
          <h3 className='text-slate-800 font-semibold'> Sponsored</h3>
          <img src={assets.sponsored_img} className='w-75 h-50 rounded-md' alt="" />
          <p className='text-slate-600'>Email Marketing</p>
          <p className='text-slate-400'>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
        </div> */}
        {/* REcent message */}
        <RecentMessages/>
      </div>
    </div>
  ) : <Loading />
}

export default Feed