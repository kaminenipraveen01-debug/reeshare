'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Heart, MessageCircle, Flag } from 'lucide-react'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState('adult_content')
  const [reportDetails, setReportDetails] = useState('')
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    init()
  }, [id])

  useEffect(() => {
    if (!post) return
    const container = document.getElementById('container-e3dc98eab42d242863668d5a88b0b4ae')
    if (container && container.childElementCount === 0) {
      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = 'https://pl31302691.profitableratecpmnetwork.com/e3dc98eab42d242863668d5a88b0b4ae/invoke.js'
      container.appendChild(script)
    }
  }, [post])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await fetchPost(user)
    await fetchComments()
  }

  const fetchPost = async (currentUser) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username), likes(user_id)')
      .eq('id', id)
      .single()

    if (!error && data) {
      setPost(data)
      setLikeCount(data.likes.length)
      if (currentUser) {
        setLiked(data.likes.some((l) => l.user_id === currentUser.id))
      }
      await supabase.rpc('increment_views', { post_id: id })
    }
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const toggleLike = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id)
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) {
      window.location.href = '/login'
      return
    }
    if (!newComment.trim()) return

    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      fetchComments()
    }
  }

  const handleReport = async () => {
    if (!user) {
      setReportMessage('You must be logged in to report.')
      return
    }
    const { error } = await supabase.from('reports').insert({
      post_id: post.id,
      reported_by: user.id,
      reason: reportReason,
      details: reportDetails,
    })
    if (error) {
      setReportMessage('Error: ' + error.message)
    } else {
      setReportMessage('Report submitted. Our team will review it.')
      setShowReportForm(false)
      setReportDetails('')
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Loading...</p>
  if (!post) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Post not found</p>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
        <Link href="/" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>← Back to Feed</Link>

        <div style={{ marginTop: '15px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)',
              color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '14px'
            }}>
              {(post.profiles?.username || 'U')[0].toUpperCase()}
            </div>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>@{post.profiles?.username || 'unknown'}</span>
          </div>

          <img src={post.media_url} alt={post.caption} style={{ width: '100%', display: 'block' }} />

          <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <button
              onClick={toggleLike}
              style={{
                background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: liked ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600'
              }}
            >
              <Heart size={20} fill={liked ? 'var(--danger)' : 'none'} color={liked ? 'var(--danger)' : 'var(--text-muted)'} />
{likeCount}
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
  <MessageCircle size={20} /> {comments.length}
</span>
          </div>

          <div style={{ padding: '6px 16px 14px' }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{post.caption}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
              {post.views} views
            </p>
          </div>
        </div>

        <div id="container-e3dc98eab42d242863668d5a88b0b4ae" style={{ marginTop: '20px' }}></div>

        {/* Comments Section */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>
            Comments ({comments.length})
          </h3>

          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder={user ? "Write a comment..." : "Login to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user}
              style={{ flex: 1, padding: '10px' }}
            />
            <button
              type="submit"
              disabled={!user}
              style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', padding: '0 18px' }}
            >
              Post
            </button>
          </form>

          {comments.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No comments yet. Be the first to comment.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)',
                color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '12px', flexShrink: 0
              }}>
                {(c.profiles?.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight: '600', fontSize: '13px', marginRight: '6px' }}>
                  @{c.profiles?.username || 'unknown'}
                </span>
                <span style={{ fontSize: '13px' }}>{c.content}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Report Section */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
          {!showReportForm ? (
            <button
  onClick={() => setShowReportForm(true)}
  style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 12px', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
>
  <Flag size={16} /> Report this post
</button>
          ) : (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '15px', borderRadius: '12px' }}>
              <p style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>Reason for reporting:</p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              >
                <option value="adult_content">Adult / Explicit Content</option>
                <option value="copyright">Copyright Issue</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
              <textarea
                placeholder="Details (optional)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px', minHeight: '60px' }}
              />
              <button onClick={handleReport} style={{ background: 'var(--danger)', color: 'white', padding: '8px 16px', border: 'none', marginRight: '10px' }}>
                Submit Report
              </button>
              <button onClick={() => setShowReportForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                Cancel
              </button>
              {reportMessage && <p style={{ marginTop: '10px', color: 'var(--success)', fontSize: '13px' }}>{reportMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}