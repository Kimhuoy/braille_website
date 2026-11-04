# Handoff: the backend for the Feedback and Contribute forms

For the person who will set up the backend. No knowledge of the rest of the website is needed.

## Where things stand

The website translates Khmer and Braille, and that part is live and needs nothing from you. It also
has two forms for the public:

* **Feedback** (`/feedback`): comments, problems, wrong translations.
* **Contribute** (`/contribute`): institutes share Braille mappings and documents.

Both pages are finished, in Khmer and English, but **closed**: they show "This form is not open yet" and
send nothing. Your job is to give them somewhere to send to, so the team receives what people submit.
The team would like to receive it in **Telegram**.

**Ways to do it**

| | Option A: switch on what is here | Option B: build your own |
|---|---|---|
| What | Code in this repo, currently off: stores records on the server, an `/admin` inbox, a Telegram bot | Any service you prefer that follows the contract below |
| Work | Settings only, about 30 minutes | You build and run it |
| Status | Tested with a fake Telegram server, **never with real Telegram or in production** | |

Choosing is up to you. Option A is the quick route, and you can change or replace it freely.

## Rules whichever you choose

1. **No secrets in the frontend.** Do not call Telegram from the browser. Anything in `Frontend/` is
   readable by every visitor, so a bot token there is public. The token belongs on a server only.
2. **Treat everything as hostile.** The forms are public, so check everything again on the server;
   the checks in the browser can be skipped.
3. **No CAPTCHA.** Many visitors are blind, and CAPTCHAs lock them out. Use the hidden `website` field, rate limits and size limits.
4. **Limit storage,** so nobody can fill your disk. Check uploaded files by their content, not by their name.
5. **Keep personal data small and private.** Forms may include contact details. Keep them out of git and out of logs.

## Open the forms

In [Frontend/src/config/forms.js](../../Frontend/src/config/forms.js), set where the forms send to:

```js
export const FORMS_API_URL = (import.meta.env.VITE_FORMS_API_URL ?? "/api").replace(/\/+$/, "");
//                                                                   ^^^^ was ""
```

Use `"/api"` for option A, or your service's address for option B. The pages open as soon as this is
deployed, so do it **last**, when the backend works. Pushing to `main` deploys the website.

## The contract

The pages send to `<FORMS_API_URL>/feedback` and `<FORMS_API_URL>/contribute`.

A success must be a 2xx status with `{"id": "<reference>"}`; the page shows the reference to the visitor.
A failure must be a 4xx or 5xx status with `{"error": "<code>"}`. The page shows its own translated
message for the codes below, and a general "something went wrong" for any other.

### POST `/feedback`

JSON body:

| Field | Required | Notes |
|---|---|---|
| `message` | **yes** | Up to 5,000 characters |
| `category` | | `suggestion`, `problem`, `translation` or `other` |
| `sample_text` | | Only for `translation`: the text being translated |
| `name`, `contact` | | Free text, up to 200 characters. `contact` is how to reply (phone, Telegram) |
| `lang` | | Interface language: `km` or `en` |
| `website` | | **Spam trap**: hidden from people. If it has any value, store nothing and answer as if it worked |

Error codes: `missing_message`, `rate_limited`, `storage_full`, `server`.

### POST `/contribute`

Multipart form:

| Field | Required | Notes |
|---|---|---|
| `consent` | **yes** | Must be `true`: the visitor confirms they may share this material |
| `name`, `organization`, `contact`, `notes` | | Free text |
| `lang` | | `km` or `en` |
| `website` | | Spam trap, as above |
| `entries` | | JSON list of `{"text": ..., "braille": ..., "source": ...}`. Braille is Braille ASCII or Unicode dots |
| `file_categories` | | JSON list, one per file in the same order: `original`, `braille`, `handbook` or `other` |
| `files` | | Up to 10 files, 20 MB each. Repeated field |

There must be at least one entry or one file. Accepted file types: `.pdf .docx .doc .odt .rtf .txt
.brf .brl .csv .xlsx .xls .json .png .jpg .jpeg`.

Error codes (extra fields are used in the message):

| Code | Extra fields |
|---|---|
| `no_consent`, `empty`, `too_large`, `rate_limited`, `storage_full`, `server` | |
| `invalid_entries` | `rows`: list of 1-based row numbers. The page **requires** this field with this code |
| `too_many_entries` | `max` |
| `too_many_files` | |
| `file_type`, `file_too_large` | `file`: the file name |

### Try it

```bash
curl -i -H "Content-Type: application/json" -d '{"message":"test","category":"other"}' <FORMS_API_URL>/feedback
curl -i -F consent=true -F 'entries=[{"text":"ក","braille":"g"}]' <FORMS_API_URL>/contribute
curl -i -H "Content-Type: application/json" -d '{"message":""}' <FORMS_API_URL>/feedback    # 400 missing_message
```

## Option A: switch on what is here

| Part | File | Does |
|---|---|---|
| Routes | [main.py](../main.py) | `/api/feedback`, `/api/contribute` |
| Storage | [feedback.py](../feedback.py), [contributions.py](../contributions.py) | One folder per record; checks; reviewing and merging ([contributions.md](contributions.md)) |
| Telegram | [telegram_notify.py](../telegram_notify.py) | Posts each record to a group |
| Inbox | [admin.py](../admin.py), `Frontend/src/Components/Home/admin-page.jsx` | `/admin`: read, delete, back up, re-send to Telegram |
| Limits | [security.py](../security.py) | Rate and size limits |

1. **Stack file on the server** (`~/docker-swarm/deployments/braille`): add `FORMS_BACKEND: "on"`,
   `ADMIN_PASSWORD` and a volume at `/data`. See [security.md, section 1](security.md#1-server-setup).
   **Without the volume, every record is lost on the next deploy.**
2. **Telegram:** create the bot and group, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, and run the
   `check` command. See [security.md, section 4](security.md). This has only been tested against a fake server, so check that a message really arrives.
3. **Frontend:** in `forms.js`, set `FORMS_API_URL` to `"/api"` and `VITE_ADMIN_PAGE`'s `"off"` to `"on"`. Deploy.
4. **Try it for real:** send one feedback message and one contribution with a file. Both should arrive
   in Telegram and appear at `/admin`. Check that `/admin` shows no yellow warnings.

Tests: `python -I -X utf8 Backend/tests/test_security.py` and `.../test_telegram.py`.

## Option B: your own service

1. Build it to the contract above and the rules at the top.
2. **Browser permissions, if it is on a different address:**
   * Your service must allow the website with CORS: `Access-Control-Allow-Origin: https://braille.idri.edu.kh`.
   * On the website's server, set `FORMS_API_ORIGIN` to your service's address (for example
     `https://forms.example.org`) in the stack file. Otherwise the website's security policy blocks the forms.
3. Set `FORMS_API_URL` in `forms.js` to your address and deploy.
4. Leave `FORMS_BACKEND` off. If you don't want the unused code in the repo, you can delete `admin.py`,
   `telegram_notify.py`, `feedback.py`, the two routes in `main.py` and the `/admin` page.
   Keep `contributions.py` if you want its reviewing and merging.

## When it is working

Contributions need a person to review them before they change the translator: see
[contributions.md](contributions.md). Agree with the team who does this.
