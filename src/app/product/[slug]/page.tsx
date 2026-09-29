import {notFound,redirect} from 'next/navigation';
import {db} from '@/lib/db';
export default async function LegacyProduct({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await db.product.findUnique({where:{slug}}).catch(() => null);if(!p)notFound();redirect('/shop/'+p.id);}
