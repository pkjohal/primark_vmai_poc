# VM.ai — Primark Visual Merchandising Compliance POC

An internal mobile-first tool for Primark store teams to scan product barcodes, verify VM displays against campaign guidelines, flag non-compliance, and track remediation tasks.

## Quick Start

```bash
git clone <repo>
cd primark_vmai_poc
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

In your Supabase SQL editor, run these files **in order**:

1. `supabase/schema.sql` — creates all tables, functions, triggers, and storage bucket
2. `supabase/indexes.sql` — performance indexes
3. `supabase/seed.sql` — stores, users, sample compliance records and tasks

## Static Assets

VM reference images go in `/public/images/`. The seed data references:
- `spring26-01.jpg` through `spring26-18.jpg`
- `trend_ends-1.jpg` through `trend_ends-6.jpg`

The VM product data is at `/public/vm_product_data.json` (included, 46 sample products).

## Mobile Testing

To test barcode scanning on a real device:

```bash
npm run dev -- --host
```

Then visit `http://<your-local-ip>:5173` on your phone. Camera scanning requires HTTPS in production — deploy to Vercel or Netlify for full device testing.

## Test Accounts

| Store | Name | Role | PIN |
|-------|------|------|-----|
| Dubai City Centre | Fatima A | Store Colleague | 1234 |
| Dubai City Centre | Omar K | VM Manager | 1234 |
| Dubai City Centre | Nadia R | Store Manager | 1234 |
| Manchester Arndale | Sarah K | Store Colleague | 1234 |
| Manchester Arndale | Tom B | VM Manager | 1234 |
| Manchester Arndale | Claire M | Store Manager | 1234 |
| London Oxford Street | Dan W | Admin | 1234 |

## Role Capabilities

| Feature | Store Colleague | VM Manager | Store Manager | Admin |
|---------|:-:|:-:|:-:|:-:|
| Scan & check products | ✓ | ✓ | ✓ | ✓ |
| Flag non-compliance | ✓ | ✓ | ✓ | ✓ |
| View & manage tasks | | ✓ | ✓ | ✓ |
| Compliance dashboard | | | ✓ | ✓ |
| User & store admin | | | | ✓ |
| Cross-store view | | | | ✓ |

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Serve production build
```

## Out of Scope (POC)

- Live VM guideline API (static JSON)
- SSO / Azure AD (PIN-based auth)
- Offline mode / service worker
- Push notifications
- Row Level Security in Supabase
- AI-powered image comparison
- Dark mode
- Multi-language support
