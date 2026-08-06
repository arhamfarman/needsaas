'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';

const LISTING_FEE_CENTS = 1000;

export function PayProductButton({ product, onPaid }: { product: Product; onPaid?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const session = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          mode: 'payment',
          amount: LISTING_FEE_CENTS,
          product_name: `Product listing: ${product.name}`,
          product_metadata: { product_id: product.id },
          success_url: `${origin}/products/${product.id}?paid=1`,
          cancel_url: `${origin}/dashboard?tab=products&cancel=1`,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? 'Checkout request failed');
      }

      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch {
      toast.error('Could not start payment. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={pay} disabled={loading} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
      {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1.5 h-3.5 w-3.5" />}
      Pay $10 to publish
    </Button>
  );
}
