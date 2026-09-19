# Deploying the admin platform

Target: `https://adminplatform-staging.swiftlyph.online`, served by nginx on
`64.176.81.108` (the same box as the API).

Every push to `main` builds in GitHub Actions and ships the static bundle
over SSH. The server runs no build step — it only serves files.

**The one thing to understand first:** `VITE_API_URL` is inlined at *build*
time, not read at runtime. The production API URL must exist in CI, and
changing it means rebuilding, not editing a file on the server.

---

## Part 1 — DNS (Cloudflare)

Add one record in the `swiftlyph.online` zone:

| Field | Value |
| --- | --- |
| Type | `A` |
| Name | `adminplatform-staging` |
| IPv4 | `64.176.81.108` |
| Proxy status | **DNS only** (grey cloud) |
| TTL | Auto |

Leave it grey-clouded until TLS works. Certbot's HTTP-01 challenge needs to
reach your origin directly; behind Cloudflare's proxy it fails with a
confusing error. Turn the proxy on afterwards if you want it.

Verify from your machine:

```powershell
nslookup adminplatform-staging.swiftlyph.online
```

Wait for `64.176.81.108` before continuing.

---

## Part 2 — Server setup (once)

SSH in:

```powershell
ssh -i "D:\Lloyd_property\personalWork\id_ed25519" linuxuser@64.176.81.108
```

### 2.1 Install nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 2.2 Create the web root

```bash
sudo mkdir -p /var/www/adminplatform-staging
sudo chown -R linuxuser:linuxuser /var/www/adminplatform-staging
```

Owned by `linuxuser` so the deploy can write without `sudo` — a deploy key
that can run `sudo` is a much bigger blast radius than one that can write a
single directory.

### 2.3 nginx config

```bash
sudo nano /etc/nginx/sites-available/adminplatform-staging
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name adminplatform-staging.swiftlyph.online;

    root /var/www/adminplatform-staging;
    index index.html;

    # The app is a client-side SPA (createBrowserRouter). Any unknown path
    # must return index.html so the router can handle it — without this,
    # a refresh on /app/users is a 404 from nginx.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Vite emits content-hashed filenames, so assets can be cached hard.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html must NEVER be cached: it is the file that points at the
    # new asset hashes. A cached one keeps serving the old bundle.
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Defence in depth; the app also sets these as meta tags.
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}
```

Enable it and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/adminplatform-staging \
            /etc/nginx/sites-enabled/adminplatform-staging
sudo nginx -t          # must print "syntax is ok" AND "test is successful"
sudo systemctl reload nginx
```

Put a placeholder in so there is something to serve:

```bash
echo '<h1>admin platform: awaiting first deploy</h1>' \
  > /var/www/adminplatform-staging/index.html
curl -I http://adminplatform-staging.swiftlyph.online
```

Expect `HTTP/1.1 200 OK`.

### 2.4 TLS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d adminplatform-staging.swiftlyph.online
```

Choose redirect HTTP → HTTPS when asked. Certbot rewrites the nginx config
and installs a renewal timer. Confirm renewal works:

```bash
sudo certbot renew --dry-run
```

### 2.5 The deploy key

Generate a keypair **on the server**, dedicated to deploys — never reuse
your personal key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "github-actions-adminplatform"
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Print the **private** key — this goes into GitHub secrets:

```bash
cat ~/.ssh/github_deploy
```

Copy everything including the `BEGIN`/`END` lines.

> Restricting this key further (`command=`, `from=` in `authorized_keys`) is
> worth doing later. It needs `rsync` and `mv`, so a plain `command=`
> restriction takes some care.

---

## Part 3 — API must allow the new origin

The browser blocks the app otherwise, and it surfaces as a misleading
"Unable to reach the server". On the server, in the API's `.env`:

```bash
FRONTEND_ORIGINS=https://adminplatform-staging.swiftlyph.online
```

Then reload the API's config (however it runs — `docker compose restart app`,
or `php artisan config:clear`).

Verify the preflight answers with the right origin:

```bash
curl -s -X OPTIONS https://api-staging.swiftlyph.online/api/v1/auth/login \
  -H "Origin: https://adminplatform-staging.swiftlyph.online" \
  -H "Access-Control-Request-Method: POST" -i | grep -i access-control-allow-origin
```

It must echo back **your** origin. Anything else and login will fail.

---

## Part 4 — GitHub configuration

In `swiftlyph/admin-platform` → **Settings**.

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Name | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | The full private key from 2.5 |
| `DEPLOY_HOST` | `64.176.81.108` |
| `DEPLOY_USER` | `linuxuser` |
| `DEPLOY_PATH` | `/var/www/adminplatform-staging` |

### Variables (same page → Variables tab)

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://api-staging.swiftlyph.online/api/v1` |
| `DEPLOY_URL` | `https://adminplatform-staging.swiftlyph.online` |

Variables, not secrets — neither is sensitive, and the build fails with a
clear message if `VITE_API_URL` is missing rather than silently producing a
bundle that calls `undefined/auth/login`.

---

## Part 5 — Ship it

The workflow is already committed at `.github/workflows/deploy.yml`.

```powershell
cd D:\Lloyd_property\MyWork\Work\Swiftly\GASA\admin-platform
git push origin main
```

Watch it under the repo's **Actions** tab. Or trigger a deploy without a
commit: **Actions → Deploy → Run workflow**.

### What each run does

1. `npm ci`, then **lint** and **typecheck** — a failure here stops the
   deploy, so broken code never reaches production
2. `npm run build` with the production API URL inlined
3. rsync `dist/` to `…​.incoming/`
4. atomic swap: previous build kept as `…​.previous`, new one moved into place
5. `curl` the live URL and fail the run if it is not 200

The swap matters: rsyncing straight into the live root serves a half-written
bundle during transfer, where `index.html` can reference an asset hash that
has not arrived yet.

---

## Rollback

The previous build is kept on the server:

```bash
cd /var/www
sudo mv adminplatform-staging adminplatform-staging.broken
sudo mv adminplatform-staging.previous adminplatform-staging
```

Instant, no rebuild. Then fix forward and push.

---

## Troubleshooting

**"Unable to reach the server" on login** — CORS. The API's
`FRONTEND_ORIGINS` must contain the exact origin including scheme. Check
Part 3.

**404 on refresh at `/app/users`** — the `try_files` line is missing or the
config was not reloaded. `sudo nginx -t && sudo systemctl reload nginx`.

**Old version after a deploy** — a cached `index.html`. Confirm the
`location = /index.html` block exists. If Cloudflare's proxy is on, purge
its cache too.

**Permission denied during rsync** — the web root is not owned by
`linuxuser`, or `DEPLOY_SSH_KEY` does not match the public key in
`authorized_keys`.

**Build fails on `VITE_API_URL`** — the repository *variable* is unset. It
is a variable, not a secret.
