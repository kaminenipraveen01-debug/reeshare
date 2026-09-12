'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { Heart, MessageCircle } from 'lucide-react'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState({})

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await fetchPosts(user)
  }

  const fetchPosts = async (currentUser) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username), likes(user_id)')
      .order('created_at', { ascending: false })

    if (!error) {
      setPosts(data)
      if (currentUser) {
        const liked = {}
        data.forEach((post) => {
          if (post.likes.some((l) => l.user_id === currentUser.id)) {
            liked[post.id] = true
          }
        })
        setLikedPosts(liked)
      }
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  const toggleLike = async (postId) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    const isLiked = likedPosts[postId]

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
      setLikedPosts((prev) => ({ ...prev, [postId]: false }))
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes.filter(l => l.user_id !== user.id) } : p))
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
      setLikedPosts((prev) => ({ ...prev, [postId]: true }))
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: [...p.likes, { user_id: user.id }] } : p))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: user ? '70px' : '0' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            Reeshare
          </span>
          {!user && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Login</Link>
              <Link href="/signup" style={{
                fontSize: '14px', background: 'var(--accent)', color: 'var(--accent-text)',
                padding: '8px 16px', borderRadius: '8px', fontWeight: '600'
              }}>Sign Up</Link>
            </div>
          )}
          {user && (
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
              padding: '6px 14px', fontSize: '13px', fontWeight: '500'
            }}>Logout</button>
          )}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>}
        {!loading && posts.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px' }}>
            No posts yet. Be the first to share something.
          </p>
        )}

        {posts.map((post) => (
          <div key={post.id} style={{
            marginBottom: '20px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)',
                color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px'
              }}>
                {(post.profiles?.username || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>
                @{post.profiles?.username || 'unknown'}
              </span>
            </div>

            <Link href={`/post/${post.id}`}>
              <img src={post.media_url} alt={post.caption} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
            </Link>

            <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <button
                onClick={() => toggleLike(post.id)}
                style={{
                  background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', color: likedPosts[post.id] ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600'
                }}
              >
                <Heart size={20} fill={likedPosts[post.id] ? 'var(--danger)' : 'none'} color={likedPosts[post.id] ? 'var(--danger)' : 'var(--text-muted)'} />
{post.likes?.length || 0}
              </button>

              <Link href={`/post/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
  <MessageCircle size={20} /> Comment
</Link>
            </div>

            <div style={{ padding: '6px 16px 14px' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{post.caption}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                {post.views} views
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav user={user} />
    </div>
  )
}