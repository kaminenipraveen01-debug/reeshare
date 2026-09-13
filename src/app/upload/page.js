'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Type } from 'lucide-react'

export default function Upload() {
  const [postType, setPostType] = useState('image')
  const [file, setFile] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpload = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to post')
      setLoading(false)
      return
    }

    if (postType === 'image') {
      if (!file) {
        setError('Please select an image')
        setLoading(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, file)
      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        caption: caption,
        media_url: urlData.publicUrl,
        media_type: 'image',
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    } else {
      if (!textContent.trim()) {
        setError('Please write something')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        caption: textContent.trim(),
        media_url: null,
        media_type: 'text',
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '800' }}>Create Post</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setPostType('image')}
          style={{
            flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            background: postType === 'image' ? 'var(--accent)' : 'var(--card-bg)',
            color: postType === 'image' ? 'var(--accent-text)' : 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <ImageIcon size={22} />
          Image
        </button>
        <button
          onClick={() => setPostType('text')}
          style={{
            flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            background: postType === 'text' ? 'var(--accent)' : 'var(--card-bg)',
            color: postType === 'text' ? 'var(--accent-text)' : 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <Type size={22} />
          Text
        </button>
      </div>

      <form onSubmit={handleUpload}>
        {postType === 'image' ? (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', minHeight: '80px' }}
            />
          </>
        ) : (
          <textarea
            placeholder="What's on your mind?"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            style={{
              width: '100%', padding: '20px', marginBottom: '10px', minHeight: '200px',
              fontSize: '20px', fontWeight: '600', textAlign: 'center',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
              color: 'white', border: 'none',
            }}
          />
        )}

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none' }}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  )
}