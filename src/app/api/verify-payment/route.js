import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  const isValid = expectedSignature === razorpay_signature

  return NextResponse.json({ valid: isValid })
}