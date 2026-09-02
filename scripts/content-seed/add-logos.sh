#!/usr/bin/env bash
# Adds a product logo sourced from Simple Icons (simpleicons.org, CC0-licensed
# brand icon set) to the product-images storage bucket, and points a
# product's logo_url at it.
#
# Uses `supabase storage cp` with the CLI's own already-linked project
# session — never a builder/user account password. If a brand isn't in
# Simple Icons, don't improvise a substitute; leave logo_url unset and let
# the existing initials-avatar fallback (in product-card.tsx /
# product-detail-view.tsx) handle it.
#
# Usage: ./add-logos.sh <product-name> <simple-icons-slug>
# Example: ./add-logos.sh "Slack" slack
#
# Look up the exact slug first:
#   curl -s https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json \
#     | node -e "const d=JSON.parse(require('fs').readFileSync(0)); console.log(d.find(i=>i.title.toLowerCase()==='slack').slug)"

set -euo pipefail

PRODUCT_NAME="${1:?Usage: add-logos.sh <product-name> <simple-icons-slug>}"
SLUG="${2:?Usage: add-logos.sh <product-name> <simple-icons-slug>}"
PROJECT_REF="wowugivczgicuqfvqgqy"
TMPFILE="$(mktemp --suffix=.svg)"

code=$(curl -s -o "$TMPFILE" -w "%{http_code}" "https://cdn.simpleicons.org/$SLUG")
if [ "$code" != "200" ]; then
  echo "No Simple Icons entry for slug '$SLUG' (HTTP $code) — leave logo_url unset instead." >&2
  rm -f "$TMPFILE"
  exit 1
fi

npx supabase storage cp --experimental --linked --project-ref "$PROJECT_REF" \
  "$TMPFILE" "ss:///product-images/editorial/logos/$SLUG.svg"
rm -f "$TMPFILE"

echo "Uploaded. Now run this SQL (e.g. via a new migration + supabase db push):"
echo "  UPDATE public.products SET logo_url = 'editorial/logos/$SLUG.svg', updated_at = now() WHERE name = '$PRODUCT_NAME';"
