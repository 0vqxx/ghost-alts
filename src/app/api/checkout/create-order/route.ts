import {NextResponse} from 'next/server';
// Orders must only be fulfilled after a real payment provider confirms payment.
// The former demo handler created synthetic credentials and marked unpaid orders delivered.
export async function POST(){return NextResponse.json({error:'Checkout is not available yet. No payment has been collected.'},{status:503});}
