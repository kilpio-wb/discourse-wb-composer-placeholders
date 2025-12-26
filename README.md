# Discourse Composer Placeholders

A custom Discourse theme component (compatible with Discourse 2025.11+) that overrides placeholder text in the composer editor for a more personalized experience.

## Overview

This component customizes the placeholder text shown in Discourse's composer editor based on the context (reply, new topic, or private message) and supports multiple locales.

## Features

- ✨ Custom placeholder text for different composer contexts
- 🌍 Multi-language support (English and Russian)
- 🔄 Graceful fallback to default placeholders for unsupported locales
- 🎯 Context-aware placeholders:
  - **Replies**: "Write your reply…" / "Напишите ответ…"
  - **New Topics**: "Start a new topic…" / "Создайте новую тему…"
  - **Private Messages**: "Write a private message…" / "Напишите личное сообщение…"

## Requirements

- Discourse version 2025.11 or higher
- Theme component support enabled

## Installation

1. **Clone or download this repository** to your Discourse server

2. **Add as a theme component**:
   - Go to Admin → Customize → Themes
   - Create a new theme or edit an existing one
   - Click "Add Component" → "From Git Repository"
   - Enter the repository URL or path to this component
   - Alternatively, you can add it as a local component by uploading the files

3. **Enable the component**:
   - Ensure the component is enabled in your theme
   - The changes will take effect immediately

## Supported Locales

Currently supports:
- **English (en)**: Custom placeholders with ellipsis
- **Russian (ru)**: Custom placeholders in Russian

For all other locales, the component preserves Discourse's default placeholder behavior.

## How It Works

The component:
1. Detects the current locale and extracts the language code
2. Defines custom translation keys for supported languages (en/ru)
3. Overrides the `replyPlaceholder` computed property in the `composer-editor` component
4. Returns the appropriate placeholder based on the composer context:
   - Private message mode
   - Creating a new topic
   - Replying to an existing topic

## Technical Details

- Uses Discourse's API initializer (version 1.8.0+)
- Leverages `I18n` for internationalization
- Extends the `composer-editor` component using Discourse's class modification system
- Uses `@discourseComputed` decorator for reactive placeholder updates

## File Structure

```
discourse-wb-composer-placeholeders/
├── component.js    # Main component logic
└── README.md       # This file
```

## Customization

To add support for additional languages:

1. Edit `component.js`
2. Add the language check in the `enabled` condition (line 8)
3. Add translation definitions for the new language (similar to lines 16-26)

Example for French:
```javascript
if (lang === "fr") {
  I18n.translations[locale].js.composer.wb_reply_placeholder = "Écrivez votre réponse…";
  I18n.translations[locale].js.composer.wb_topic_placeholder = "Créer un nouveau sujet…";
  I18n.translations[locale].js.composer.wb_pm_placeholder = "Écrire un message privé…";
}
```

## License

This component is provided as-is for use with Discourse forums.

## Support

For issues or questions, please refer to your Discourse installation's support channels or create an issue in the repository.

