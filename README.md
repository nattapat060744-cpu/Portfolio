# Portfolio (Next.js + Supabase)

## Run on your machine
1. Install Node.js 20+ (nodejs.org)
2. Run the SQL in `schema.sql` in Supabase (SQL Editor) after replacing YOUR_EMAIL@example.com
3. Copy `.env.local.example` to `.env.local` and fill in the 3 values
4. `npm install` then `npm run dev` -> http://localhost:3000
5. Admin: http://localhost:3000/admin

## Pages
- `/`                      public site (data from Supabase, refreshed every ~30s)
- `/admin`                 project list (show/hide, edit, delete)
- `/admin/projects/new`    add a project (cover upload, YouTube link)
- `/admin/settings`        name, bio, stats, skills, tools, timeline

## Deploy (Vercel)
Set the same 3 env variables in Vercel -> Settings -> Environment Variables,
and set Framework Preset to Next.js.
