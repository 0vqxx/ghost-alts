'use client';
import {useRouter} from 'next/navigation';
import {ArrowUpRight,ShoppingBag,Check} from 'lucide-react';
import {ProductItem} from '@/lib/types';
import {useCart} from '@/context/CartContext';
export function ProductActions({product}:{product:ProductItem}){const {addItem,closeCart,items}=useCart(),router=useRouter();const added=items.some(item=>item.product.id===product.id);const available=product.active&&product.stockCount>0;
return <div className="purchase-actions"><button disabled={!available} className="button button-primary" onClick={()=>{addItem(product,1);closeCart();router.push('/checkout');}}>{available?'Continue to checkout':'Sold out'}<ArrowUpRight size={18}/></button><button disabled={!available} className="button button-secondary" onClick={()=>{addItem(product,1);}}>{added?<Check size={17}/>:<ShoppingBag size={17}/>} {added?'Added to cart':'Add to cart'}</button></div>}
