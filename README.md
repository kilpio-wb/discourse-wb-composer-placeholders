# WB Composer Placeholders

A Discourse **theme component** that customizes the placeholder text shown in the composer *before the user starts typing*.

It supports different placeholders for:

- **New topic**
- **Reply**
- **Private message**

It is designed for multilingual forums:

- It uses your WB placeholder **only** for languages where you explicitly saved an override.
- For all other languages, it uses Discourse’s **default** placeholder for that context and language.

## For forum users

- The placeholder follows your current interface language.
- This component does not change how messages are posted and does not collect any data.

## For administrators

### Install

1. Go to **Admin → Appearance → Themes and components**.
2. Open the **Components** tab.
3. Click **Install** → **From a Git repository**.
4. Paste the repository URL: `https://github.com/kilpio-wb/discourse-wb-composer-placeholders`
5. After install, include the component in the theme(s) where you want it enabled.

### Set your placeholder texts

1. Go to **Admin → Appearance → Themes and components → Components**.
2. Open **WB Composer Placeholders**.
3. Open the **Translations** tab.
4. Select a language in the language picker.
5. Set any of these keys (multi‑line text is supported):

   - `js.composer.wb_topic_placeholder` — shown when creating a new topic
   - `js.composer.wb_reply_placeholder` — shown when replying
   - `js.composer.wb_pm_placeholder` — shown when creating a private message

6. Click **Save**.

### How fallback works

- If a key is **not** defined for the current locale, the component falls back to Discourse’s built‑in placeholders (via `super.replyPlaceholder`).
- If the user’s locale is a regional variant (for example `de-DE`), an override saved for the base language (`de`) will also apply.

### Notes about the Translations editor

In the Translations UI, you may see “fallback” values (often English or the site default) when a language has no saved override yet. This is normal.

A practical workflow:

- Always select the target language in the picker.
- Type your value and press **Save** to create an override for that language.
- If you don’t want a custom placeholder for a language, leave it unset — those users will get the standard Discourse placeholder in their language.

## Compatibility & version

- Minimum Discourse version: **3.0.0**
- Theme version: **1.1.18**

## Support

Project home: https://github.com/kilpio-wb/discourse-wb-composer-placeholders