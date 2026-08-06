import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { product_id } = body;

      if (!product_id) {
        return new Response(JSON.stringify({ error: "product_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the product
      const { data: product } = await supabase
        .from("products")
        .select("id, name, tagline, description, category_id, owner_id")
        .eq("id", product_id)
        .maybeSingle();

      if (!product || product.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: "Product not found or not owned" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch open needs that don't already have a match with this product
      const { data: openNeeds } = await supabase
        .from("needs")
        .select("id, title, description, category_id, status")
        .neq("status", "closed")
        .limit(200);

      if (!openNeeds || openNeeds.length === 0) {
        return new Response(JSON.stringify({ matches: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simple keyword-based matching algorithm
      const productText = `${product.name} ${product.tagline} ${product.description}`.toLowerCase();
      const productWords = productText.split(/\s+/).filter((w: string) => w.length > 3);
      const productWordSet = new Set(productWords);

      const matches: Array<{
        need_id: string;
        need_title: string;
        score: number;
        reasons: string[];
      }> = [];

      for (const need of openNeeds) {
        const needText = `${need.title} ${need.description}`.toLowerCase();
        const needWords = needText.split(/\s+/).filter((w: string) => w.length > 3);
        const needWordSet = new Set(needWords);

        // Calculate overlap
        let overlap = 0;
        const matchedWords: string[] = [];
        for (const word of needWordSet) {
          if (productWordSet.has(word)) {
            overlap++;
            matchedWords.push(word);
          }
        }

        // Category match bonus
        const categoryMatch = product.category_id && need.category_id && product.category_id === need.category_id;

        // Calculate score (0-100)
        let score = 0;
        if (needWordSet.size > 0) {
          score = Math.round((overlap / needWordSet.size) * 70);
        }
        if (categoryMatch) score += 20;
        if (overlap >= 3) score += 10;

        score = Math.min(score, 100);

        if (score >= 15) {
          const reasons: string[] = [];
          if (categoryMatch) reasons.push("Same category");
          if (overlap >= 5) reasons.push(`Strong keyword overlap (${overlap} terms)`);
          else if (overlap >= 2) reasons.push(`Keyword overlap (${overlap} terms)`);
          if (matchedWords.length > 0) {
            reasons.push(`Shared: ${matchedWords.slice(0, 5).join(", ")}`);
          }

          matches.push({
            need_id: need.id,
            need_title: need.title,
            score,
            reasons,
          });
        }
      }

      // Sort by score descending
      matches.sort((a, b) => b.score - a.score);

      // Store top matches in need_matches table
      const topMatches = matches.slice(0, 10);
      for (const m of topMatches) {
        await supabase.from("need_matches").upsert({
          product_id,
          need_id: m.need_id,
          match_score: m.score,
          match_reasons: m.reasons.join("; "),
          status: "suggested",
        }, { onConflict: "product_id,need_id" });
      }

      return new Response(JSON.stringify({ matches: topMatches }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET: fetch matches for a product
    if (req.method === "GET") {
      const url = new URL(req.url);
      const productId = url.searchParams.get("product_id");
      if (!productId) {
        return new Response(JSON.stringify({ error: "product_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("need_matches")
        .select(`*, need:needs(id, title, description, status, vote_count, reward_amount, category:categories(*))`)
        .eq("product_id", productId)
        .order("match_score", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ matches: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
