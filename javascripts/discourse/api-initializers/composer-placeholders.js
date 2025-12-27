import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

// This will execute as soon as the module loads - if you see this, the file is being loaded
console.log("[WB Composer Placeholders] ===== MODULE LOADED ===== File is being executed");
console.log("[WB Composer Placeholders] Checking imports:", {
  apiInitializer: typeof apiInitializer,
  I18n: typeof I18n,
  discourseComputed: typeof discourseComputed,
  apiInitializerIsFunction: typeof apiInitializer === "function"
});

let componentInitializer;
try {
  componentInitializer = apiInitializer("1.8.0", (api) => {
    console.log("[WB Composer Placeholders] ===== Component initializing ===== API callback called");
    console.log("[WB Composer Placeholders] API received:", {
      hasApi: !!api,
      hasModifyClass: typeof api?.modifyClass,
      apiKeys: api ? Object.keys(api) : []
    });
  
  // Defensive check for I18n availability
  if (!I18n || !I18n.translations) {
    console.warn("[WB Composer Placeholders] I18n not available, composer placeholders component disabled");
    return;
  }

  console.log("[WB Composer Placeholders] I18n available:", {
    I18n: !!I18n,
    translations: !!I18n.translations,
    currentLocale: I18n.currentLocale ? I18n.currentLocale() : "N/A"
  });

  const locale = I18n.currentLocale() || "";
  const lang = String(locale).split(/[-_]/)[0] || ""; // "en", "ru", etc.
  const enabled = lang && (lang === "en" || lang === "ru");
  
  console.log("[WB Composer Placeholders] Locale detection:", {
    locale,
    lang,
    enabled
  });

  // Set up translations: ensure structure exists and set defaults only if not already set
  // This allows locale files and /admin/customize/text overrides to take precedence
  if (enabled && locale) {
    console.log("[WB Composer Placeholders] Setting up translations for locale:", locale);
    
    I18n.translations[locale] ||= {};
    I18n.translations[locale].js ||= {};
    I18n.translations[locale].js.composer ||= {};
    
    // Check existing values (might be from overrides or locale files)
    const existingReply = I18n.translations[locale].js.composer.wb_reply_placeholder;
    const existingTopic = I18n.translations[locale].js.composer.wb_topic_placeholder;
    const existingPm = I18n.translations[locale].js.composer.wb_pm_placeholder;
    
    console.log("[WB Composer Placeholders] Existing translations (before setting defaults):", {
      wb_reply_placeholder: existingReply,
      wb_topic_placeholder: existingTopic,
      wb_pm_placeholder: existingPm
    });
    
    // Set defaults only if they don't exist (using ||= which only sets if falsy/undefined)
    // This means overrides from /admin/customize/text will be preserved
    if (lang === "en") {
      I18n.translations[locale].js.composer.wb_reply_placeholder ||= "Write your reply…";
      I18n.translations[locale].js.composer.wb_topic_placeholder ||= "Start a new topic…";
      I18n.translations[locale].js.composer.wb_pm_placeholder ||= "Write a private message…";
    }
    
    if (lang === "ru") {
      I18n.translations[locale].js.composer.wb_reply_placeholder ||= "Напишите ответ…";
      I18n.translations[locale].js.composer.wb_topic_placeholder ||= "Создайте новую тему…";
      I18n.translations[locale].js.composer.wb_pm_placeholder ||= "Напишите личное сообщение…";
    }
    
    console.log("[WB Composer Placeholders] Final translations (after setting defaults):", {
      wb_reply_placeholder: I18n.translations[locale].js.composer.wb_reply_placeholder,
      wb_topic_placeholder: I18n.translations[locale].js.composer.wb_topic_placeholder,
      wb_pm_placeholder: I18n.translations[locale].js.composer.wb_pm_placeholder,
      note: existingReply ? "Override preserved" : "Default set"
    });
  } else {
    console.log("[WB Composer Placeholders] Skipping translation setup - not enabled or no locale");
  }

  try {
    console.log("[WB Composer Placeholders] Attempting to modify composer-editor component...");
    
    api.modifyClass("component:composer-editor", (Superclass) => {
      if (!Superclass) {
        console.warn("[WB Composer Placeholders] composer-editor component not found");
        return;
      }

      console.log("[WB Composer Placeholders] composer-editor component found, extending...");

      return class extends Superclass {
        @discourseComputed(
          "composer.model.creatingTopic",
          "composer.model.replyingToTopic",
          "composer.model.privateMessage",
          "composer.model.action"
        )
        replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action) {
          console.log("[WB Composer Placeholders] replyPlaceholder called with:", {
            creatingTopic,
            replyingToTopic,
            privateMessage,
            action,
            composerModel: this.composer?.model ? {
              creatingTopic: this.composer.model.creatingTopic,
              replyingToTopic: this.composer.model.replyingToTopic,
              privateMessage: this.composer.model.privateMessage,
              action: this.composer.model.action
            } : "no composer.model"
          });

          // Defensive check for I18n availability
          if (!I18n || !I18n.currentLocale) {
            console.log("[WB Composer Placeholders] I18n not available in replyPlaceholder, using super");
            const result = super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
            console.log("[WB Composer Placeholders] Super result:", result);
            return result;
          }

          // Compute enabled dynamically to handle locale changes at runtime
          const currentLocale = I18n.currentLocale() || "";
          const currentLang = String(currentLocale).split(/[-_]/)[0] || "";
          const isEnabled = currentLang && (currentLang === "en" || currentLang === "ru");

          console.log("[WB Composer Placeholders] Runtime locale check:", {
            currentLocale,
            currentLang,
            isEnabled
          });

          // For non EN/RU locales keep core placeholder behavior intact.
          if (!isEnabled) {
            console.log("[WB Composer Placeholders] Locale not enabled, using super");
            const result = super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
            console.log("[WB Composer Placeholders] Super result:", result);
            return result;
          }

          const isPm = !!privateMessage || action === "createPrivateMessage";
          
          console.log("[WB Composer Placeholders] Determining placeholder type:", {
            isPm,
            creatingTopic,
            replyingToTopic
          });
          
          // Determine which translation key to use
          let translationKey;
          if (isPm) {
            translationKey = "composer.wb_pm_placeholder";
          } else if (creatingTopic) {
            translationKey = "composer.wb_topic_placeholder";
          } else if (replyingToTopic) {
            translationKey = "composer.wb_reply_placeholder";
          } else {
            translationKey = "composer.wb_reply_placeholder";
          }
          
          // Check if translation exists at runtime (overrides might load after initialization)
          const translationKeyName = translationKey.replace("composer.wb_", "").replace("_placeholder", "");
          const directAccess = I18n.translations[currentLocale]?.js?.composer?.[`wb_${translationKeyName}_placeholder`];
          
          // Ensure translation exists - set default if missing (overrides will still work via I18n.t())
          if (!directAccess && currentLang === "en") {
            I18n.translations[currentLocale].js.composer[`wb_${translationKeyName}_placeholder`] ||= 
              translationKeyName === "pm" ? "Write a private message…" :
              translationKeyName === "topic" ? "Start a new topic…" :
              "Write your reply…";
          } else if (!directAccess && currentLang === "ru") {
            I18n.translations[currentLocale].js.composer[`wb_${translationKeyName}_placeholder`] ||= 
              translationKeyName === "pm" ? "Напишите личное сообщение…" :
              translationKeyName === "topic" ? "Создайте новую тему…" :
              "Напишите ответ…";
          }
          
          // Use I18n.t() to get the translation - this respects overrides from /admin/customize/text
          const translated = I18n.t(translationKey);
          
          const finalValue = I18n.translations[currentLocale]?.js?.composer?.[`wb_${translationKeyName}_placeholder`];
          
          console.log("[WB Composer Placeholders] Translation resolution:", {
            translationKey,
            translationKeyName,
            existedBefore: !!directAccess,
            valueBefore: directAccess,
            valueAfter: finalValue,
            viaI18nT: translated,
            note: directAccess ? "Translation existed (possibly override)" : "Default was set"
          });
          
          // Return the translated string directly (I18n.t() handles overrides)
          return translated;
        }
      };
    });
    
    console.log("[WB Composer Placeholders] Component modification completed successfully");
  } catch (error) {
    console.error("[WB Composer Placeholders] Failed to modify composer-editor:", error);
    console.error("[WB Composer Placeholders] Error stack:", error.stack);
  }
  
  console.log("[WB Composer Placeholders] Component initialization complete");
  });
} catch (error) {
  console.error("[WB Composer Placeholders] ===== FATAL ERROR ===== Failed to create apiInitializer:", error);
  console.error("[WB Composer Placeholders] Error details:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    toString: error.toString()
  });
  // Re-throw to prevent silent failure
  throw error;
}

console.log("[WB Composer Placeholders] Module setup complete, exporting:", {
  hasComponentInitializer: !!componentInitializer,
  type: typeof componentInitializer
});

export default componentInitializer;

