'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState('adult_content')
  const [reportDetails, setReportDetails] = useState('')
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    fetchPost()
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

  const handleReport = async () => {
    const { data: { user } } = await supabase.auth.getUser()

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

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()

    if (!error && data) {
      setPost(data)
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

      <div id="container-e3dc98eab42d242863668d5a88b0b4ae" style={{ marginTop: '20px' }}></div>

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        {!showReportForm ? (
          <button
            onClick={() => setShowReportForm(true)}
            style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '6px', color: '#666', cursor: 'pointer' }}
          >
            🚩 Report this post
          </button>
        ) : (
          <div style={{ background: '#fafafa', padding: '15px', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Reason for reporting:</p>
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
            <button
              onClick={handleReport}
              style={{ background: '#dc2626', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', marginRight: '10px' }}
            >
              Submit Report
            </button>
            <button
              onClick={() => setShowReportForm(false)}
              style={{ background: 'none', border: 'none', color: '#666' }}
            >
              Cancel
            </button>
            {reportMessage && <p style={{ marginTop: '10px', color: 'green' }}>{reportMessage}</p>}
          </div>
        )}
      </div>
    </div>
  )
}