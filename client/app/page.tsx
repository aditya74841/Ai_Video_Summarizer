import React, { Suspense } from 'react'
import HomePage from './components/HomePage'

const Home = () => {
  return (
     <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🎬</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Loading AI Video Summarizer...
            </h2>
          </div>
        </div>
      }
    >
       <HomePage/> 
    </Suspense>
   
  )
}

export default Home


