# Security, server setup and domain names

For whoever deploys and looks after the website. Sections 1 and 2 are steps to do on
the server and in Cloudflare; the code cannot do them. Section 3 explains what the code does.

> **The Feedback and Contribute backend is currently off**, and those pages say they are not open
> yet. `/admin`, the `/data` volume and Telegram (section 4) only matter once it is switched on: see
> [forms-backend-handoff.md](forms-backend-handoff.md). Everything else here applies now.

## 1. Server setup

Add this to the `web` service in the swarm stack file used by `deploy.sh`
(`~/docker-swarm/deployments/braille` on the server, not in this repository):

```yaml
services:
  web:
    environment:
      FORMS_BACKEND: "on"                 # the Feedback and Contribute backend, and /admin
      ADMIN_PASSWORD: "<the password>"    # opens the /admin page
    volumes:
      - braille-data:/data                # keeps messages and contributions across deploys

volumes:
  braille-data:
```

**Choose the password with this command** (long, and without `$`, which the stack file would change):

```bash
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

* Fewer than 12 characters, or no password: `/admin` stays closed. The rest of the website works normally.
* To change it: edit the stack file and deploy again. Everyone is signed out.
* It belongs to the website alone. It is not an email, Microsoft or CADT account, so do not reuse one of those passwords.
* If the service runs more than one replica, every replica needs the same `/data`. With a local volume, use `replicas: 1`.

**Check after deploying:** sign in at `/admin`. Yellow warnings at the top name anything still wrong:

| Warning | Meaning | Fix |
|---|---|---|
| Records are stored inside the container | `/data` is not a volume, so records are lost on the next deploy | Add the `volumes` lines above |
| Only N GB of disk left | Forms stop accepting records below 1 GB (the translator keeps working) | Free some disk, or back up and delete old records |
| The proxy hides visitors' addresses | All visitors share one rate limit | Section 1.1 |

### 1.1 Real visitor addresses

Rate limits count requests per visitor address. Docker Swarm's default port publishing replaces
the address with an internal one, so if `/admin` shows this warning, publish Traefik's ports in host mode:

```yaml
    ports:
      - { target: 80,  published: 80,  mode: host }
      - { target: 443, published: 443, mode: host }
```

Until then the site still works, with one wider limit shared by everyone.

`TRUSTED_PROXY_HOPS` must equal the number of proxies in front of the app. The default, 1, is
correct for Traefik alone. **If Cloudflare proxying (orange cloud) is ever turned on for this
name, set it to 2**, or every visitor will appear to come from Cloudflare.

### 1.2 Firewall

Only ports 80, 443 and SSH should be reachable from the internet. The app's own port must be
reachable only through Traefik; a visitor who reached gunicorn directly could fake their address
and avoid the rate limits.

## 2. Domain names

### What was found (4 November 2026)

| Address | Public DNS | Result |
|---|---|---|
| `https://braille.idri.edu.kh` | `103.16.63.37` | **Works** (valid Let's Encrypt certificate) |
| `http://braille.idri.edu.kh` | `103.16.63.37` | **404 from Traefik**: nothing handles plain HTTP, and there is no redirect to HTTPS |
| `https://www.braille.idri.edu.kh` | **No such name** | **Fails**: no DNS record. Even with one, Traefik has no route (404) and no certificate for it (`TRAEFIK DEFAULT CERT`) |
| Any other `*.braille.idri.edu.kh` | **No such name** | Fails the same way |

The application is not the cause: it answers on any host name and calls its API on the same
address. A name must exist in **all three** places, and only the first row does:

1. **DNS** (Cloudflare, zone `idri.edu.kh`) points the name to the server.
2. **Traefik** has a route for the name.
3. **The certificate** covers the name. The current one covers only `braille.idri.edu.kh`.

> **Testing from the CADT network can mislead you.** On the computer tested, every DNS lookup of
> a name that does not exist returned `36.37.242.94`, even with `nslookup <name> 8.8.8.8`. That
> makes a missing name look real, and then it just times out. To see the true answer, open
> `https://dns.google/resolve?name=www.braille.idri.edu.kh`: `"Status":3` means the name does not exist.

### Fix: step 1, DNS (Cloudflare)

Add this record, in zone `idri.edu.kh`:

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `www.braille` | `braille.idri.edu.kh` | **DNS only (grey cloud)** |

It must be grey. Cloudflare's free certificate covers `*.idri.edu.kh` but not a name two levels
deep, so with the orange cloud browsers would show a TLS error. Grey also matches how
`braille.idri.edu.kh` is set up today.

Wait until the `dns.google` link above shows an answer before step 2. Traefik cannot get a
certificate for a name that does not resolve yet.

### Fix: step 2, Traefik

On the `web` service's `deploy.labels` in the stack file, keep your existing router and service
names and your certificate resolver name (replace `<resolver>`), and make these rules match:

```yaml
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.services.braille.loadbalancer.server.port=80

        # HTTPS, for both names
        - traefik.http.routers.braille.rule=Host(`braille.idri.edu.kh`) || Host(`www.braille.idri.edu.kh`)
        - traefik.http.routers.braille.entrypoints=websecure
        - traefik.http.routers.braille.tls.certresolver=<resolver>
        - traefik.http.routers.braille.middlewares=braille-to-main

        # http:// -> https://  (this is the current 404)
        - traefik.http.routers.braille-http.rule=Host(`braille.idri.edu.kh`) || Host(`www.braille.idri.edu.kh`)
        - traefik.http.routers.braille-http.entrypoints=web
        - traefik.http.routers.braille-http.middlewares=braille-to-https
        - traefik.http.middlewares.braille-to-https.redirectscheme.scheme=https
        - traefik.http.middlewares.braille-to-https.redirectscheme.permanent=true

        # www -> the main name, so there is one address and one admin sign-in
        - traefik.http.middlewares.braille-to-main.redirectregex.regex=^https://www\.braille\.idri\.edu\.kh/(.*)
        - traefik.http.middlewares.braille-to-main.redirectregex.replacement=https://braille.idri.edu.kh/$${1}
        - traefik.http.middlewares.braille-to-main.redirectregex.permanent=true
```

Entrypoint names (`web`, `websecure`) must match Traefik's own configuration. `$${1}` is correct:
the stack file turns `$$` into `$`.

To add **another subdomain**, repeat both steps with that name. A name for a different service
(for example `api.braille...`) needs its own route to that service instead.

### Check

```bash
curl -I http://braille.idri.edu.kh          # 301 to https://braille.idri.edu.kh/
curl -I https://www.braille.idri.edu.kh     # 301 to https://braille.idri.edu.kh/
curl -I https://braille.idri.edu.kh         # 200, with the security headers from section 3
```

## 3. What the code does

Most of this is in `Backend/security.py`, with the limits at the top of that file. Tests:
`python -I -X utf8 Backend/tests/test_security.py`.

**Feedback and contributions**

* No email, Microsoft or other organization account is involved. Records are stored on the server's
  volume, and the team manages them at `/admin`: read, set status, download, delete, back up. If
  Telegram is set up (section 4), a copy also goes to the team's group.
* Visitors give no personal details. Name, institute and contact are optional. The less collected, the less there is to leak.
* There is **no CAPTCHA, on purpose**: this website serves blind users, and CAPTCHAs block them.
  Spam is stopped by a hidden trap field, rate limits and daily caps instead.
* Uploaded files are checked by their content, not just their name, so a renamed program is refused.
  They are never served to the public, and `/admin` only offers them as downloads, so they cannot run inside the site.
* `.zip` is no longer accepted, because its contents cannot be checked.

**Admin sign-in**

* Rate limited: 10 tries per address and 100 from all addresses per 15 minutes.
* The session lasts at most 8 hours. Its cookie is `Secure`, `HttpOnly`, `SameSite=Strict` and
  `__Host-` (so no other subdomain can read or set it).
* Other websites cannot act as a signed-in admin (custom header required, no CORS on `/api/admin`).

**Rate limits**, per visitor address, shared across gunicorn workers:

| Route | Limit |
|---|---|
| Translate text | 600 per minute; long texts count for more |
| File upload, G-code | 30 per 10 minutes |
| Feedback / contribution | 10 per hour, and 500 / 100 per day from everyone together |

These are wide because a whole school can share one address. If legitimate users are ever
refused, raise `RATE_LIMITS` in `security.py`.

**Everything else**

* Security headers on every response: Content-Security-Policy, HSTS (without `includeSubDomains`,
  so it cannot break other subdomains), X-Frame-Options and others.
* CORS is closed. The site calls its own address, so other websites need no access. `CORS_ORIGINS` can open it.
* Every route has a request size limit. Malicious documents are refused: zip bombs, XML entity attacks, giant PDF pages.
* Text people translate is no longer printed to the server logs. Error messages no longer reveal internal details.
* Nothing a visitor uploads or downloads stays on the server. G-code files and uploaded documents
  are deleted as soon as the request ends, also if the download is cancelled. Anything left by a
  killed worker is removed automatically after 15 minutes (`temp_files.py`). Word, TXT and BRF
  downloads are made in the visitor's browser and are never on the server. Before this, every
  G-code download and upload stayed on the disk.
* Feedback and contributions are records for the team, not temporary files: they stay, including
  after a download from `/admin`, until the team deletes them there.
* Workers run as an unprivileged user and cannot change the code. Python and npm packages with known
  vulnerabilities were upgraded or, if unused, removed.

**Known and accepted**

* `react-router` 6 has two moderate advisories. They need attacker-controlled link targets or
  server-side rendering, and this site has neither. They disappear with an upgrade to version 7.
* `vite` and the lint tools have advisories, but they run only while building or developing,
  never on the public server.

Check for new problems from time to time (for example every few months):

```bash
cd Frontend && npm audit --omit=dev
pip install pip-audit && pip-audit -r Backend/requirements.txt
```

## 4. Telegram (optional, needs the forms backend switched on)

Each new feedback message and contribution is posted to the team's private Telegram group, with
any uploaded files. The bot only sends: it reads no commands, so messaging it does nothing.

**Set up (about 5 minutes)**

1. In Telegram, message **@BotFather**, send `/newbot`, and copy the token it gives you.
2. Create a **private** group for the team and add the bot.
3. In that group, send `/start@<your bot's name>`.
4. On the server, with the token set, find the group's ID (it starts with `-`):

   ```bash
   docker exec -e TELEGRAM_BOT_TOKEN="<token>" <container> python telegram_notify.py find-chat
   ```

5. Add both settings to the `web` service in the stack file and deploy:

   ```yaml
       environment:
         TELEGRAM_BOT_TOKEN: "<token>"
         TELEGRAM_CHAT_ID: "<group id>"
   ```

6. Test it: `docker exec <container> python telegram_notify.py check`

**If something goes wrong:** nothing is lost. The record stays on the server, and `/admin` shows
how many have not reached Telegram, with a **Send again** button. Records saved before Telegram
was set up are not sent.

The server must be able to reach `https://api.telegram.org`.

**Keeping it safe**

* The token lets anyone post as the bot. Keep it in the stack file only, never in git. If it leaks,
  send `/revoke` to @BotFather and update the stack file.
* Keep the group small, and remove people who leave the team: everyone in it can read every
  message and contact detail, including older ones.
* Visitors' messages and files are stored by Telegram as well as on your server, and bot messages
  are not end-to-end encrypted. Deleting a record on `/admin` does not delete the Telegram copy.
* Files come from the public. Open them only if you expect them, and not on a phone you rely on.
