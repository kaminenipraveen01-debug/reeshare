import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { amount } = await request.json()

  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise లో (₹1 = 100 paise)
      currency: 'INR',
      receipt: `boost_${Date.now()}`,
    })
    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}