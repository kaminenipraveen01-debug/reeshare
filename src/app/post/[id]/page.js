'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  fetchPost()
}, [id])

useEffect(() => {
  const script = document.createElement('script')
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  script.src = 'https://pl31302691.profitableratecpmnetwork.com/e3dc98eab42d242863668d5a88b0b4ae/invoke.js'
  document.getElementById('container-e3dc98eab42d242863668d5a88b0b4ae')?.appendChild(script)
}, [id])

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()

    if (!error && data) {
  setPost(data)
  // View count పెంచడం (safe function ద్వారా)
  await supabase.rpc('increment_views', { post_id: id })
}
    setLoading(false)
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>
  if (!post) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Post not found</p>

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <Link href="/" style={{ color: '#7C3AED' }}>← Back to Feed</Link>

      <div style={{ marginTop: '15px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '10px', fontWeight: 'bold' }}>
          @{post.profiles?.username || 'unknown'}
        </div>
        <img src={post.media_url} alt={post.caption} style={{ width: '100%', display: 'block' }} />
        <div style={{ padding: '10px' }}>
          <p>{post.caption}</p>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
            {post.views} views
          </p>
        </div>
      </div>

      {/* Ad ఇక్కడ Phase 4 లో వస్తుంది */}
      <div id="container-e3dc98eab42d242863668d5a88b0b4ae" style={{ marginTop: '20px' }}></div>
    </div>
  )
}