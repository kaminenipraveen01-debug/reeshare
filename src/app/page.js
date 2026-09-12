'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error) {
      setPosts(data)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold', color: '#7C3AED' }}>Reeshare</h1>
<p style={{ color: '#666', marginBottom: '20px' }}>Login to continue</p>
        <div>
          {user ? (
            <>
              <Link href="/upload" style={{ marginRight: '15px' }}>Upload</Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ marginRight: '15px' }}>Login</Link>
              <Link href="/signup">Signup</Link>
            </>
          )}
        </div>
      </div>

      {loading && <p>Loading posts...</p>}
      {!loading && posts.length === 0 && <p>No posts yet. Be the first to post!</p>}

      {posts.map((post) => (
        <div key={post.id} style={{ marginBottom: '30px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px', fontWeight: 'bold' }}>
            @{post.profiles?.username || 'unknown'}
          </div>
          <Link href={`/post/${post.id}`}>
  <img src={post.media_url} alt={post.caption} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
</Link>
          <div style={{ padding: '10px' }}>
            <p>{post.caption}</p>
            <p style={{ fontSize: '12px', color: '#888' }}>{post.views} views</p>
          </div>
        </div>
      ))}
    </div>
  )
}