import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Test connection and retrieval of categories
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoryError) {
      return NextResponse.json({ 
        success: false, 
        step: 'fetch_categories', 
        error: categoryError.message 
      }, { status: 500 });
    }

    // 2. Test connection and retrieval of needs (with join)
    const { data: needs, error: needsError } = await supabase
      .from('needs')
      .select('*, category:categories(*), profile:profiles(*)')
      .limit(5);

    if (needsError) {
      return NextResponse.json({ 
        success: false, 
        step: 'fetch_needs', 
        error: needsError.message 
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful and data retrieval working properly.',
      performance: `${duration}ms`,
      data: {
        categories_count: categories?.length || 0,
        needs_count: needs?.length || 0,
        sample_categories: categories,
        sample_needs: needs
      },
      instructions: 'To test data storage (insertion), please navigate to the UI Dashboard, sign in (you can use your newly configured Google Login), and try posting a new Need. Then refresh this page to see it appear here.'
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
