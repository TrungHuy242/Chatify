import React from 'react'
import { useAuthStore } from '../store/useAuthStore';

function ChatPage() {

  const { logout } = useAuthStore();

  return (
    <div className='w-full h-full flex items-center justify-center text-white text-2xl relative z-10'>
      Chat Page
      <button onClick={logout} className='ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'>
        logout
      </button>
    </div>
  )
}

export default ChatPage
