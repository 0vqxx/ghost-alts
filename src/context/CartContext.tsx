'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, ProductItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: ProductItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discountCode: string | null;
  discountPercent: number;
  discountAmount: number;
  total: number;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ghostalts_cart');
      const savedCode = localStorage.getItem('ghostalts_discount');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      if (savedCode) {
        const parsed = JSON.parse(savedCode);
        setDiscountCode(parsed.code);
        setDiscountPercent(parsed.percent);
      }
    } catch {
      // ignore parsing errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('ghostalts_cart', JSON.stringify(items));
      if (discountCode) {
        localStorage.setItem(
          'ghostalts_discount',
          JSON.stringify({ code: discountCode, percent: discountPercent })
        );
      } else {
        localStorage.removeItem('ghostalts_discount');
      }
    } catch {
      // ignore storage errors
    }
  }, [items, discountCode, discountPercent, isLoaded]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addItem = (product: ProductItem, quantity = 1) => {
    if (!product.active || product.stockCount < 1) return;
    quantity = Math.min(product.stockCount, Math.max(1, Math.floor(quantity)));
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stockCount, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode(null);
    setDiscountPercent(0);
    try {
      localStorage.removeItem('ghostalts_cart');
      localStorage.removeItem('ghostalts_discount');
    } catch {}
  };

  const applyDiscountCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'GHOST10') {
      setDiscountCode('GHOST10');
      setDiscountPercent(10);
      return { success: true, message: 'Promo code applied: 10% OFF' };
    }
    if (cleanCode === 'WELCOME15') {
      setDiscountCode('WELCOME15');
      setDiscountPercent(15);
      return { success: true, message: 'Welcome code applied: 15% OFF' };
    }
    return { success: false, message: 'Invalid or expired coupon code' };
  };

  const removeDiscountCode = () => {
    setDiscountCode(null);
    setDiscountPercent(0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discountCode,
        discountPercent,
        discountAmount,
        total,
        applyDiscountCode,
        removeDiscountCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
