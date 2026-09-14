'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

const PLANS = [
  { amount: 100, targetViews: 1500, requiredUsers: 1000 },
  { amount: 200, targetViews: 4000, requiredUsers: 2500 },
  { amount: 300, targetViews: 8000, requiredUsers: 5000 },
]

export default function Boost() {
  const { postId } = useParams()
  const router = useRouter()
  const [post, setPost] = useState(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    init()
  }, [postId])

  useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  document.body.appendChild(script)
}, [])

  const init = async () => {
    const { data: postData } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
    setPost(postData)

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    setTotalUsers(count || 0)

    setLoading(false)
  }

  const activateBoost = async (user) => {
  const { error: boostError } = await supabase.from('boosts').insert({
    post_id: postId,
    user_id: user.id,
    amount_paid: selectedPlan.amount,
    target_views: selectedPlan.targetViews,
    views_at_boost_start: post.views,
    status: 'active',
  })

  if (boostError) {
    setMessage('Error: ' + boostError.message)
    setProcessing(false)
    return
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({
      is_boosted: true,
      boost_target_views: post.views + selectedPlan.targetViews,
    })
    .eq('id', postId)

  if (updateError) {
    setMessage('Error: ' + updateError.message)
    setProcessing(false)
    return
  }

  setMessage('Boost activated! Your post will now get priority in the feed.')
  setTimeout(() => router.push(`/post/${postId}`), 1500)
}

const handleBoost = async () => {
  if (!selectedPlan) {
    setMessage('Please select a plan')
    return
  }

  setProcessing(true)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }

  // Step 1: Order create చేయడం (backend ద్వారా)
  const orderRes = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: selectedPlan.amount }),
  })
  const order = await orderRes.json()

  if (order.error) {
    setMessage('Error creating order: ' + order.error)
    setProcessing(false)
    return
  }

  // Step 2: Razorpay Checkout popup తెరవడం
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: 'INR',
    name: 'Reeshare',
    description: `Boost - ₹${selectedPlan.amount} plan`,
    order_id: order.id,
    handler: async function (response) {
      // Step 3: Payment verify చేయడం
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      })
      const verifyData = await verifyRes.json()

      if (verifyData.valid) {
        await activateBoost(user)
      } else {
        setMessage('Payment verification failed. Please contact support.')
        setProcessing(false)
      }
    },
    prefill: {
      email: user.email,
    },
    theme: {
      color: '#7B3DFF',
    },
    modal: {
      ondismiss: function () {
        setProcessing(false)
        setMessage('Payment cancelled.')
      },
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Loading...</p>
  if (!post) return <p style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Post not found</p>

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
      <Link href={`/post/${postId}`} style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>← Back</Link>

      <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '16px 0 6px' }}>Boost Your Post</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
        Get more views. Support the platform.
      </p>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Current platform users: {totalUsers}
      </p>

      {PLANS.map((plan) => {
        const isEnabled = totalUsers >= plan.requiredUsers
        const isSelected = selectedPlan?.amount === plan.amount

        return (
          <div
            key={plan.amount}
            onClick={() => isEnabled && setSelectedPlan(plan)}
            style={{
              padding: '16px',
              marginBottom: '12px',
              borderRadius: '12px',
              border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: 'var(--card-bg)',
              opacity: isEnabled ? 1 : 0.5,
              cursor: isEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>₹{plan.amount}</span>
              {!isEnabled && (
                <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600' }}>Locked</span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              ~{plan.targetViews.toLocaleString()} views
            </p>
            {!isEnabled && (
              <p style={{ fontSize: '11px', color: 'var(--danger)', margin: '6px 0 0' }}>
                Available once platform reaches {plan.requiredUsers.toLocaleString()} users
                (currently {totalUsers.toLocaleString()})
              </p>
            )}
          </div>
        )
      })}

      {message && <p style={{ color: message.includes('Error') ? 'var(--danger)' : 'var(--success)', fontSize: '13px', marginTop: '10px' }}>{message}</p>}

      <button
        onClick={handleBoost}
        disabled={!selectedPlan || processing}
        style={{
          width: '100%', padding: '14px', marginTop: '10px',
          background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
          opacity: (!selectedPlan || processing) ? 0.5 : 1,
        }}
      >
        {processing ? 'Processing...' : 'Proceed to Boost'}
      </button>
    </div>
  )
}