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
      apiKeys: api ? Object.keys(api) : [],
      fullApi: api // Log full API to see what's available
    });
    
    // Check if API has theme-related methods
    if (api) {
      console.log("[WB Composer Placeholders] API inspection:", {
        hasGetTranslations: typeof api.getTranslations === 'function',
        hasGetThemeTranslations: typeof api.getThemeTranslations === 'function',
        hasTheme: !!api.theme,
        themeKeys: api.theme ? Object.keys(api.theme) : [],
        allApiProperties: Object.getOwnPropertyNames(api),
        fullApiObject: api // Log full API to inspect
      });
      
      // Try to access theme translations if available
      if (api.theme) {
        console.log("[WB Composer Placeholders] Theme object found:", {
          themeType: typeof api.theme,
          themeValue: api.theme,
          themeKeys: Object.keys(api.theme || {})
        });
      }
    }
  
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
    
    // Deep inspection of I18n structure to find overrides
    const fullI18nInspection = {
      hasOverrides: !!I18n.overrides,
      overridesStructure: I18n.overrides ? Object.keys(I18n.overrides) : null,
      overridesForLocale: I18n.overrides?.[locale],
      translationsStructure: {
        hasLocale: !!I18n.translations[locale],
        localeKeys: I18n.translations[locale] ? Object.keys(I18n.translations[locale]) : [],
        hasJs: !!I18n.translations[locale]?.js,
        jsKeys: I18n.translations[locale]?.js ? Object.keys(I18n.translations[locale].js) : [],
        hasComposer: !!I18n.translations[locale]?.js?.composer,
        composerKeys: I18n.translations[locale]?.js?.composer ? Object.keys(I18n.translations[locale].js.composer) : []
      },
      // Check for override methods
      hasMissing: typeof I18n.missing === 'function',
      hasLookup: typeof I18n.lookup === 'function',
      I18nMethods: Object.keys(I18n).filter(k => typeof I18n[k] === 'function')
    };
    
    console.log("[WB Composer Placeholders] ===== DEEP I18n INSPECTION =====", fullI18nInspection);
    
    // Try to find overrides in different possible locations
    const overrideChecks = {
      direct: {
        wb_reply_placeholder: existingReply,
        wb_topic_placeholder: existingTopic,
        wb_pm_placeholder: existingPm
      },
      viaI18nT: {
        wb_reply_placeholder: I18n.t("composer.wb_reply_placeholder"),
        wb_topic_placeholder: I18n.t("composer.wb_topic_placeholder"),
        wb_pm_placeholder: I18n.t("composer.wb_pm_placeholder")
      },
      fullPath: {
        wb_reply_placeholder: I18n.t("js.composer.wb_reply_placeholder"),
        wb_topic_placeholder: I18n.t("js.composer.wb_topic_placeholder"),
        wb_pm_placeholder: I18n.t("js.composer.wb_pm_placeholder")
      }
    };
    
    console.log("[WB Composer Placeholders] Existing translations (before setting defaults):", {
      directAccess: overrideChecks.direct,
      viaI18nT_composer: overrideChecks.viaI18nT,
      viaI18nT_js_composer: overrideChecks.fullPath,
      note: "Checking multiple access methods to find overrides"
    });
    
    // DON'T set defaults at initialization - let locale files and overrides handle it
    // We'll set defaults at runtime only if I18n.t() can't find the translation
    // This ensures overrides from /admin/customize/text work correctly
    console.log("[WB Composer Placeholders] Skipping default setting at initialization - will set at runtime if needed");
    console.log("[WB Composer Placeholders] Current translations (from locale files or overrides):", {
      wb_reply_placeholder: I18n.translations[locale].js.composer.wb_reply_placeholder,
      wb_topic_placeholder: I18n.translations[locale].js.composer.wb_topic_placeholder,
      wb_pm_placeholder: I18n.translations[locale].js.composer.wb_pm_placeholder,
      note: "These come from locale files or will be set at runtime if missing"
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
          const model = this.composer?.model;
        
          // Optional debug log (keep it short)
          console.log("[WB Composer Placeholders] replyPlaceholder:", {
            creatingTopic,
            replyingToTopic,
            privateMessage,
            action,
            model: model
              ? {
                  creatingTopic: model.creatingTopic,
                  replyingToTopic: model.replyingToTopic,
                  privateMessage: model.privateMessage,
                  action: model.action,
                }
              : null,
          });
        
          // If I18n isn't available for some reason, keep core behavior
          if (typeof I18n === "undefined" || typeof I18n.currentLocale !== "function") {
            return super.replyPlaceholder(...arguments);
          }
        
          // Keep core behavior intact for non EN/RU locales
          const locale = I18n.currentLocale() || "";
          const lang = String(locale).split(/[-_]/)[0] || "";
          const enabled = lang === "en" || lang === "ru";
          if (!enabled) {
            return super.replyPlaceholder(...arguments);
          }
        
          // Determine context (prefer args, fallback to composer model)
          const mCreatingTopic = creatingTopic ?? model?.creatingTopic;
          const mReplyingToTopic = replyingToTopic ?? model?.replyingToTopic;
          const mPrivateMessage = privateMessage ?? model?.privateMessage;
          const mAction = action ?? model?.action;
        
          const isPm = !!mPrivateMessage || mAction === "createPrivateMessage";
        
          // IMPORTANT: Return THEME translation keys, not "composer.*" core keys
          if (isPm) return themePrefix("wb_placeholders.pm");
          if (mCreatingTopic) return themePrefix("wb_placeholders.topic");
          if (mReplyingToTopic) return themePrefix("wb_placeholders.reply");
        
          // Fallback: treat everything else like reply
          return themePrefix("wb_placeholders.reply");
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

