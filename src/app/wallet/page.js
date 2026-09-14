'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Wallet() {
  const [profile, setProfile] = useState(null)
  const [earnings, setEarnings] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [upiDetails, setUpiDetails] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: earningsData } = await supabase
      .from('earnings_log')
      .select('*, posts(caption)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: withdrawalsData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    setProfile(profileData)
    setEarnings(earningsData || [])
    setWithdrawals(withdrawalsData || [])
    setLoading(false)
  }

  const handleWithdrawRequest = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!profile || profile.available_balance < 1000) {
      setMessage('You need at least ₹1000 balance to withdraw.')
      return
    }

    if (!upiDetails.trim()) {
      setMessage('Please enter your UPI ID or bank details.')
      return
    }

    setRequesting(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('withdrawals').insert({
  user_id: user.id,
  amount: profile.available_balance,
  upi_or_bank_details: upiDetails,
  status: 'pending',
})

if (error) {
  setMessage('Error: ' + error.message)
} else {
  await supabase
    .from('profiles')
    .update({ available_balance: 0 })
    .eq('id', user.id)

  setMessage('Withdrawal request sent! You will receive the money after admin approval.')
  setUpiDetails('')
  fetchWalletData()
}

    setRequesting(false)
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#7C3AED', marginBottom: '20px' }}>
        Wallet
      </h1>

      <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>Available Balance</p>
        <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#7C3AED' }}>
          ₹{profile?.available_balance?.toFixed(2) || '0.00'}
        </p>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
          Lifetime earnings: ₹{profile?.lifetime_earnings?.toFixed(2) || '0.00'}
        </p>
      </div>

      {profile?.available_balance >= 1000 ? (
        <form onSubmit={handleWithdrawRequest} style={{ marginBottom: '30px' }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Withdraw Request</p>
          <input
            type="text"
            placeholder="UPI ID (e.g. name@upi)"
            value={upiDetails}
            onChange={(e) => setUpiDetails(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
          <button
            type="submit"
            disabled={requesting}
            style={{ width: '100%', padding: '10px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '6px' }}
          >
            {requesting ? 'Sending...' : `Withdraw ₹${profile.available_balance.toFixed(2)}`}
          </button>
          {message && <p style={{ color: message.includes('Error') || message.includes('need') ? 'red' : 'green', marginTop: '10px' }}>{message}</p>}
        </form>
      ) : (
        <p style={{ color: '#888', marginBottom: '30px' }}>
          The withdraw button appears once your balance reaches ₹1000. (Current: ₹{profile?.available_balance?.toFixed(2) || '0.00'})
        </p>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Earnings History</h2>
      {earnings.length === 0 && <p style={{ color: '#888' }}>No earnings yet.</p>}
      {earnings.map((e) => (
        <div key={e.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <span>{e.posts?.caption || 'Post'} — {e.period_month}</span>
          <span style={{ color: '#7C3AED', fontWeight: 'bold' }}>+₹{e.amount}</span>
        </div>
      ))}

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '20px 0 10px' }}>Withdrawal History</h2>
      {withdrawals.length === 0 && <p style={{ color: '#888' }}>No withdrawals yet.</p>}
      {withdrawals.map((w) => (
        <div key={w.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <span>₹{w.amount} — {new Date(w.requested_at).toLocaleDateString()}</span>
          <span style={{
            color: w.status === 'paid' ? 'green' : w.status === 'rejected' ? 'red' : '#888',
            fontWeight: 'bold'
          }}>
            {w.status}
          </span>
        </div>
      ))}
    </div>
  )
}