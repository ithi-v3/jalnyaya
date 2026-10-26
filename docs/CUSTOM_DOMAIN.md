# 🌐 JalNyaya — Custom Domain Setup

> Optional guide to connect a custom domain to your deployed JalNyaya app.

---

## 1. Get a Domain

| Provider                         | Cost           | Notes                        |
| -------------------------------- | -------------- | ---------------------------- |
| [Namecheap](https://namecheap.com) | ~₹700/yr     | `.me`, `.xyz` are cheapest   |
| [GoDaddy](https://godaddy.com)    | ~₹500/yr     | First-year discounts         |
| [Porkbun](https://porkbun.com)    | ~₹600/yr     | Good prices, free WHOIS privacy |

**Free subdomain options** (no purchase needed):

- [FreeDNS](https://freedns.afraid.org) — get a subdomain like `jalnyaya.mooo.com`
- [is-a.dev](https://is-a.dev) — free `.is-a.dev` subdomain for developers (GitHub-based)

---

## 2. Connect Domain to Vercel (Frontend)

1. Go to your Vercel project → **Settings → Domains**
2. Add your domain: `jalnyaya.yourdomain.com` (or `yourdomain.com`)
3. Vercel will show the required DNS records:

   | Type    | Name    | Value                          |
   | ------- | ------- | ------------------------------ |
   | A       | `@`     | `76.76.21.21`                  |
   | CNAME   | `www`   | `cname.vercel-dns.com`         |

4. Add these records in your domain provider's DNS settings
5. Wait 5–30 min for DNS propagation
6. Vercel auto-provisions **SSL/HTTPS** — no action needed

---

## 3. Connect Subdomain to Render (Backend API)

1. Go to your Render service → **Settings → Custom Domains**
2. Add: `api.yourdomain.com`
3. Render will show a CNAME record:

   | Type    | Name    | Value                               |
   | ------- | ------- | ----------------------------------- |
   | CNAME   | `api`   | `your-service.onrender.com`         |

4. Add this CNAME in your domain provider's DNS settings
5. Render auto-provisions **SSL/HTTPS**

---

## 4. Update Environment Variables

After connecting custom domains, update these values:

**On Render (backend):**
```
FRONTEND_URL=https://jalnyaya.yourdomain.com
```

**On Vercel (frontend):**
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Redeploy both services after changing env vars.

---

## 5. Verify

- [ ] `https://jalnyaya.yourdomain.com` loads the frontend
- [ ] `https://api.yourdomain.com/api/health` returns 200
- [ ] Login works (no CORS errors in browser console)
- [ ] HTTPS padlock shows on both URLs

> **DNS can take up to 48 hours** to fully propagate, but usually works within 30 minutes.
