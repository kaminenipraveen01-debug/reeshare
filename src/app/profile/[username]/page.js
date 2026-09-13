'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [username])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (!profileData) {
      setLoading(false)
      return
    }
    setProfile(profileData)

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })
    setPosts(postsData || [])

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileData.id)
    setFollowerCount(followers || 0)

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileData.id)
    setFollowingCount(following || 0)

    if (user) {
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileData.id)
        .maybeSingle()
      setIsFollowing(!!followData)
    }

    setLoading(false)
  }

  const toggleFollow = async () => {
    if (!currentUser) {
      window.location.href = '/login'
      return
    }

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount((c) => c - 1)
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUser.id,
        following_id: profile.id,
      })
      setIsFollowing(true)
      setFollowerCount((c) => c + 1)
    }
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Loading...</p>
  if (!profile) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>User not found</p>

  const isOwnProfile = currentUser && currentUser.id === profile.id

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)',
            color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '26px', flexShrink: 0
          }}>
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>@{profile.username}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              {posts.length} posts
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px' }}>
          <span><strong>{followerCount}</strong> <span style={{ color: 'var(--text-muted)' }}>Followers</span></span>
          <span><strong>{followingCount}</strong> <span style={{ color: 'var(--text-muted)' }}>Following</span></span>
        </div>

        {!isOwnProfile && (
          <button
            onClick={toggleFollow}
            style={{
              width: '100%', padding: '10px', marginBottom: '20px',
              background: isFollowing ? 'var(--card-bg)' : 'var(--accent)',
              color: isFollowing ? 'var(--text)' : 'var(--accent-text)',
              border: isFollowing ? '1px solid var(--border)' : 'none',
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
          {posts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`}>
              <img src={post.media_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', borderRadius: '4px' }} />
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '30px' }}>No posts yet.</p>
        )}
      </div>
      <BottomNav user={currentUser} />
    </div>
  )
}