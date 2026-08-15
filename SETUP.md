# Jehoshaphat Mends Portfolio — Beginner Setup

## 1. Supabase
1. Create a free Supabase project.
2. Open **SQL Editor** and run `supabase-schema.sql`.
3. Go to **Authentication → Users → Add user** and create a private admin email/password. This is separate from the public website.
4. Copy that user's UUID and run the final `insert into public.admin_users...` statement in `supabase-schema.sql`.
5. In **Project Settings → API**, copy the Project URL and the publishable/anon key into `config.js`.
6. Do **not** put a service-role key in `config.js`.

Supabase Auth handles email/password sign-in and RLS controls which authenticated user can manage content. Storage is used for project and artboard image uploads.

## 2. Beginner editing
- **Colors:** `style.css` → `:root` at the top.
- **Animation speed:** `config.js` → `animations`.
- **Default images:** `index.html`, `projects.html`, `artboard.html`, `about.html` use files in `assets/` as the starting content. Once Supabase is configured, admin content overrides the public cards/strips.
- **Text/content:** easiest to change through `/admin.html` after Supabase is connected.
- **Admin:** `/admin.html` is intentionally not in the public navigation.

## 3. GitHub Pages
Push the whole folder to a GitHub repository and enable **Settings → Pages**. Because the site is plain HTML/CSS/JS, no build step is required.

If using a custom domain, add the domain in GitHub Pages settings and configure the DNS records with your domain provider.

## 4. Important security note
The browser uses only the Supabase publishable/anon key. Database and Storage permissions are protected by Row Level Security and the `admin_users` table. Never add a Supabase service-role key to this GitHub repository.
