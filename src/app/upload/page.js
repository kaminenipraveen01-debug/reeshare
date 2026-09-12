'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Upload() {
  const [file, setFile] = useState(null)
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

    if (!file) {
      setError('Please select an image')
      setLoading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

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

    setLoading(false)
    router.push('/')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold', color: '#7C3AED' }}>Create Post</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', minHeight: '80px' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#7C3AED', color: 'white' }}
        >
          {loading ? 'Uploading...' : 'Post'}
        </button>
      </form>
    </div>
  )
}