# Jehoshaphat Mends Portfolio + Company Management & Client Portal

A beginner-friendly portfolio website powered by **HTML, CSS, JavaScript, GitHub Pages and Supabase**.

The project contains:

- Public portfolio pages
- Projects and Artboards
- Supabase image storage
- Admin dashboard
- Project/artboard management
- Contact/enquiry messages
- New-message notifications
- Client accounts and login
- Client project tracking
- Work/progress updates
- Invoice creation and viewing
- Client-to-designer messaging
- Site settings and editable content

---

## 1. HOW THE SYSTEM WORKS

### Public website

Visitors can browse:

- Home: `index.html`
- About: `about.html`
- Projects: `projects.html`
- Artboard: `artboard.html`
- Contact: `contact.html`
- Project/Artboard details: `work.html`

Visitors do not need an account to view the portfolio or submit an enquiry.

### Admin system

The admin area is `admin.html`.

The admin uses **Supabase Authentication** for login. Admin permissions are controlled by the `admin_users` table and Supabase Row Level Security (RLS).

The admin can:

- Add, edit and delete projects
- Add, edit and delete artboards
- Upload project/artboard images
- Manage client records
- Assign projects to clients
- Change project status
- Add work/progress updates
- Create invoices
- Add invoice line items
- Send messages to clients
- Read website enquiries
- Mark messages as read
- Receive new-message notifications

### Client portal

The client portal is `client.html`.

Clients can:

- Sign up
- Log in
- View their assigned projects
- Track project status
- Read work/progress updates
- View invoices
- View invoice details
- Print/save invoices from the browser
- Send messages to the designer
- Receive portal notifications

Client access is controlled by Supabase Authentication and RLS so a client can only access records belonging to their own account.

---

# 2. SUPABASE SETUP

Create a project at:

https://supabase.com/

Open your Supabase project and go to **SQL Editor**.

## Step 1 — Run the main schema

Open:

`supabase-schema.sql`

Run the complete file.

If you have already run it, do not worry about duplicate-policy errors. Run only the missing statements or use the updated schema files carefully.

## Step 2 — Run notification setup

Open:

`supabase-schema-notifications.sql`

Run it after the main schema.

This supports the website enquiry notification system.

## Step 3 — Run company/client setup

Open:

`supabase-company-schema.sql`

Run it after the main portfolio schema.

This creates/updates:

- `clients`
- `work_updates`
- `invoices`
- `invoice_items`
- `client_messages`
- `client_notifications`

It also adds the client relationship to projects and enables RLS.

## Step 4 — Create your Storage bucket

In Supabase:

**Storage → New bucket**

Create a bucket named:

`portfolio-images`

Use the Storage policies supplied by your project/schema if present.

For public portfolio images, the bucket can be public. Never put private documents or secrets in a public bucket.

## Step 5 — Enable Realtime

For live messages/notifications, make sure the relevant message tables are enabled for Realtime in Supabase.

The project uses Realtime for new messages and notifications while the relevant dashboard/portal is open.

---

# 3. CREATE YOUR ADMIN ACCOUNT

Go to:

**Supabase → Authentication → Users**

Create an email/password user.

Copy the user's **UUID**.

Then open **SQL Editor** and run:

```sql
insert into public.admin_users (user_id)
values ('YOUR-USER-UUID')
on conflict (user_id) do nothing;
```

Replace `YOUR-USER-UUID` with the actual UUID.

Then open:

`admin.html`

and log in.

If you see:

> This account is not an administrator.

it normally means the signed-in user's UUID has not been added to `admin_users`.

---

# 4. SUPABASE CONFIGURATION

Open:

`config.js`

You will see:

```js
const SITE_CONFIG = {
  supabaseUrl: 'YOUR-SUPABASE-URL',
  supabaseKey: 'YOUR-SUPABASE-PUBLISHABLE-KEY'
};
```

Use the URL and **publishable/anon key** from:

**Supabase → Project Settings → API**

Do **not** use a service-role/secret key here.

The publishable/anon key is designed to be used by browser applications. Your real security comes from Authentication, RLS and Storage policies.

---

# 5. IMAGE UPLOADS

Images uploaded through the admin area should be stored in Supabase Storage.

The database keeps the image path/URL needed to render the image.

If an image does not appear:

1. Open Supabase → Storage.
2. Check that the file exists.
3. Check the bucket name.
4. Check the Storage policy.
5. Check that the database record contains the correct image path.
6. Check the browser console for a Supabase Storage error.

Do not upload extremely large images. Compress images before uploading when possible.

Recommended formats:

- WebP
- JPG/JPEG
- PNG

---

# 6. HOW TO ADD A PROJECT

1. Log in to `admin.html`.
2. Open Projects.
3. Enter the project title.
4. Add the category.
5. Add the description.
6. Select/upload the image.
7. Optionally assign the project to a client.
8. Save.

The public Projects page loads the records from Supabase.

Clicking a project opens `work.html` and displays the project details.

---

# 7. HOW TO ADD AN ARTBOARD

1. Log in to the Admin dashboard.
2. Open Artboards.
3. Add the title/category/description.
4. Upload the image.
5. Save.

Clicking an Artboard opens the same `work.html` detail system used by projects.

---

# 8. CLIENT WORKFLOW

A simple workflow is:

**Client signs up → Admin creates/links client record → Admin assigns project → Admin adds progress updates → Client tracks progress → Admin creates invoice → Client views invoice → Client and designer message each other.**

If you create a client manually in the admin dashboard, make sure the client's email matches the email they use for their portal account when linking the account.

---

# 9. INVOICE WORKFLOW

The admin can create an invoice with:

- Invoice number
- Client
- Issue date
- Due date
- Currency
- Status
- Notes
- Multiple invoice items
- Quantity
- Unit price

The invoice total is calculated from the line items.

The client can view the invoice after logging in.

The client can use the browser's print function to save the invoice as a PDF.

---

# 10. MESSAGES & NOTIFICATIONS

### Website enquiries

A visitor submits the Contact form.

The enquiry is stored in Supabase and appears in the Admin Messages area.

The admin dashboard can show a new-message counter and notification while the dashboard is open.

### Client messages

Clients can send messages from the Client Portal.

Admins can reply from the Admin dashboard.

Messages are stored in `client_messages`.

### Important

Browser notifications normally require the user to grant notification permission and the admin dashboard must be open. This is not the same as sending an email or phone notification.

---

# 11. EDITING COLORS

Open:

`style.css`

Find the `:root` section near the beginning of the file.

Example:

```css
:root {
  --primary: #111111;
  --accent: #d4a017;
  --background: #ffffff;
  --text: #111111;
}
```

Change the values to your preferred brand colors.

Always keep enough contrast between text and background.

---

# 12. EDITING ANIMATIONS

Open:

`config.js`

The animation settings are near the bottom/top configuration section.

Example:

```js
animations: {
  revealDuration: 700,
  revealDistance: 24,
  projectStagger: 90,
  artboardSpeed: 28,
  logoSpeed: 24
}
```

Beginner guide:

- Increase `revealDuration` = slower reveal animation
- Increase `revealDistance` = larger movement
- Increase `projectStagger` = more delay between cards
- Change `artboardSpeed` = change the artboard scrolling speed
- Change `logoSpeed` = change logo strip speed

---

# 13. EDITING IMAGES

There are two main ways to change images.

### Method A — Admin dashboard

Use the Admin upload tools for projects and artboards.

This is recommended because the image is stored in Supabase and can be changed without editing HTML.

### Method B — Local website images

For static images, look in:

`assets/`

You can replace an image while keeping the same filename and dimensions/format where practical.

If changing an image reference in HTML/CSS/JS, search for the old filename and replace it with the new path.

---

# 14. HOSTING ON GITHUB PAGES

GitHub Pages hosts the public HTML/CSS/JavaScript frontend.

Supabase hosts the backend/database/authentication/storage.

They work together like this:

```text
Visitor
   ↓
GitHub Pages
   ↓
HTML / CSS / JavaScript
   ↓
Supabase
   ├── Authentication
   ├── Database
   ├── Storage
   └── Realtime
```

## Step 1 — Create a GitHub repository

Go to:

https://github.com/

Create a new repository.

For a public portfolio, you can use a public repository. Never commit passwords, service-role keys, private API keys or other secrets.

## Step 2 — Upload the project

Upload all project files, including:

- HTML files
- CSS files
- JS files
- `assets/`
- `config.js`
- Supabase SQL files
- `README.md`

## Step 3 — Enable GitHub Pages

Open:

**Repository → Settings → Pages**

Under **Build and deployment** choose:

- Source: **Deploy from a branch**
- Branch: your main branch
- Folder: `/ (root)`

Save.

GitHub will provide a Pages address.

## Step 4 — Custom domain

If you own a domain:

**Repository → Settings → Pages → Custom domain**

Enter your domain and save.

Configure your domain's DNS records according to GitHub's current instructions.

## Step 5 — HTTPS

After GitHub issues the certificate, enable:

**Enforce HTTPS**

Your site should load with:

`https://yourdomain.com`

instead of:

`http://yourdomain.com`

---

# 15. CUSTOM DOMAIN SECURITY

If your browser says **Not Secure**, first check that you are using HTTPS.

For GitHub Pages:

1. Confirm the custom domain is correctly configured.
2. Confirm DNS records point to GitHub Pages.
3. Wait for the SSL certificate to be issued.
4. Enable **Enforce HTTPS**.
5. Test the site using an `https://` address.

Do not install your own SSL certificate on GitHub Pages.

---

# 16. SECURITY CHECKLIST

Before publishing:

- [ ] Never put the Supabase service-role/secret key in frontend files.
- [ ] Use the publishable/anon key in `config.js`.
- [ ] Enable RLS on private database tables.
- [ ] Test that one client cannot see another client's projects.
- [ ] Test that one client cannot see another client's invoices.
- [ ] Test that one client cannot read another client's messages.
- [ ] Protect Storage uploads with appropriate policies.
- [ ] Use Supabase Authentication for admin/client accounts.
- [ ] Add only trusted administrator UUIDs to `admin_users`.
- [ ] Use HTTPS/GitHub Pages.
- [ ] Do not commit passwords or secret API keys.
- [ ] Remove test accounts/data before launch.

### Important

A Supabase publishable/anon key appearing in browser JavaScript is not by itself a security failure. RLS and Storage policies must be configured correctly so that the key cannot be used to access records it should not access.

---

# 17. TROUBLESHOOTING

## "This account is not an administrator"

Add the authenticated user's UUID to `admin_users`.

## Image does not render

Check:

- Storage bucket
- Storage policy
- Image path in the database
- Supabase URL
- Browser console

## Policy already exists

This means the policy was already created. Do not repeatedly create the same policy. Use `drop policy if exists ...` before recreating a policy when a clean migration is required.

## GitHub page is blank

Check:

- Browser console
- File names/capitalization
- Relative paths
- `config.js`
- Supabase URL/key

GitHub Pages is case-sensitive, so `Assets/image.jpg` and `assets/image.jpg` are different paths.

## Client cannot log in

Check:

- Supabase Authentication is enabled.
- The user exists in Authentication → Users.
- Email/password is being used correctly.
- The client profile is linked to the correct user ID.

## Client sees no projects

Check that the project's `client_id` matches the correct client record.

---

# 18. BEGINNER EDITING GUIDE

If you are new to coding, start with these files:

| File | What to edit |
|---|---|
| `config.js` | Supabase connection + animation settings |
| `style.css` | Colors, spacing, layout, buttons |
| `index.html` | Home page structure/content |
| `about.html` | About page |
| `projects.html` | Project page structure |
| `artboard.html` | Artboard page structure |
| `contact.html` | Contact page |
| `assets/` | Static images |
| `admin.html` | Admin dashboard interface |
| `client.html` | Client portal interface |

For database/content changes, prefer using the Admin dashboard instead of editing HTML.

---

# 19. RECOMMENDED PRODUCTION SETUP

Use:

- **GitHub Pages** → public frontend
- **Supabase** → database, authentication, storage and realtime
- **Supabase RLS** → database security
- **Supabase Storage policies** → image/file security
- **HTTPS** → secure browser connection

For future email notifications, connect a server-side/Edge Function email provider. Never put an email provider's private API key inside browser JavaScript.

---

# 20. FINAL DEPLOYMENT ORDER

Follow this order:

1. Create Supabase project.
2. Run `supabase-schema.sql`.
3. Run `supabase-schema-notifications.sql`.
4. Run `supabase-company-schema.sql`.
5. Create `portfolio-images` Storage bucket.
6. Configure Storage policies.
7. Create admin Authentication user.
8. Add admin UUID to `admin_users`.
9. Add Supabase URL/publishable key to `config.js`.
10. Test Admin login locally.
11. Upload a test project image.
12. Test project rendering.
13. Test client signup/login.
14. Create a test client.
15. Assign a test project.
16. Create a test invoice.
17. Test client messages.
18. Test enquiry notifications.
19. Push the project to GitHub.
20. Enable GitHub Pages.
21. Connect the custom domain if needed.
22. Enable HTTPS.
23. Test the complete site from a normal visitor account and a separate client account.

---

## Support principle

Keep the frontend public and keep private data protected by Supabase Authentication + RLS. The browser should never contain service-role or secret credentials.
