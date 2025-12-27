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

  // Note: We no longer set JavaScript defaults here.
  // Defaults should come from locale files (locales/en.yml, locales/ru.yml).
  // This allows /admin/customize/text overrides to work correctly.
  // The locale files are automatically loaded by Discourse.
  
  console.log("[WB Composer Placeholders] Translation setup:", {
    locale,
    lang,
    enabled,
    note: "Defaults come from locale files, overrides from /admin/customize/text will take precedence"
  });
  
  // Just ensure the structure exists (but don't set values - let locale files and overrides handle that)
  if (enabled && locale) {
    I18n.translations[locale] ||= {};
    I18n.translations[locale].js ||= {};
    I18n.translations[locale].js.composer ||= {};
    
    console.log("[WB Composer Placeholders] Translation structure ensured. Checking existing values:", {
      wb_reply_placeholder: I18n.translations[locale].js.composer.wb_reply_placeholder,
      wb_topic_placeholder: I18n.translations[locale].js.composer.wb_topic_placeholder,
      wb_pm_placeholder: I18n.translations[locale].js.composer.wb_pm_placeholder,
      source: "from locale files or overrides"
    });
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
          
          // Check if translations exist
          const translationPath = `js.composer.wb_${isPm ? 'pm' : creatingTopic ? 'topic' : 'reply'}_placeholder`;
          const translationKey = `composer.wb_${isPm ? 'pm' : creatingTopic ? 'topic' : 'reply'}_placeholder`;
          const translationExists = I18n.translations[currentLocale]?.js?.composer?.[`wb_${isPm ? 'pm' : creatingTopic ? 'topic' : 'reply'}_placeholder`];
          
          console.log("[WB Composer Placeholders] Translation check:", {
            translationPath,
            translationKey,
            translationExists,
            fullPath: I18n.translations[currentLocale]?.js?.composer
          });
          
          // Return translation keys - the component will translate them using I18n.t()
          // Overrides from /admin/customize/text will be respected when I18n.t() is called
          // Note: Discourse automatically looks in js.* namespace, so we use "composer.*" format
          let result;
          if (isPm) {
            result = "composer.wb_pm_placeholder";
          } else if (creatingTopic) {
            result = "composer.wb_topic_placeholder";
          } else if (replyingToTopic) {
            result = "composer.wb_reply_placeholder";
          } else {
            result = "composer.wb_reply_placeholder";
          }
          
          console.log("[WB Composer Placeholders] Returning translation key:", result);
          
          // Deep check of I18n structure to find overrides
          const fullTranslationPath = `js.composer.wb_${isPm ? 'pm' : creatingTopic ? 'topic' : 'reply'}_placeholder`;
          const directAccess = I18n.translations[currentLocale]?.js?.composer?.[`wb_${isPm ? 'pm' : creatingTopic ? 'topic' : 'reply'}_placeholder`];
          const viaI18nT = I18n.t(result);
          
          console.log("[WB Composer Placeholders] Translation resolution:", {
            key: result,
            fullPath: fullTranslationPath,
            directAccess: directAccess,
            viaI18nT: viaI18nT,
            I18nOverrides: I18n.overrides ? I18n.overrides[currentLocale] : "no overrides object",
            allComposerKeys: Object.keys(I18n.translations[currentLocale]?.js?.composer || {}),
            I18nTranslationsStructure: {
              hasLocale: !!I18n.translations[currentLocale],
              hasJs: !!I18n.translations[currentLocale]?.js,
              hasComposer: !!I18n.translations[currentLocale]?.js?.composer
            }
          });
          
          return result;
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

