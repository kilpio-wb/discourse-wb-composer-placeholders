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
          const fullKeyName = `wb_${translationKeyName}_placeholder`;
          
          // Deep inspection at runtime
          const runtimeInspection = {
            translationKey,
            translationKeyName,
            fullKeyName,
            directAccess: I18n.translations[currentLocale]?.js?.composer?.[fullKeyName],
            viaI18nT_composer: I18n.t(translationKey),
            viaI18nT_full: I18n.t(`js.${translationKey}`),
            fullPath: `js.${translationKey}`,
            I18nOverrides: I18n.overrides?.[currentLocale],
            I18nOverridesJs: I18n.overrides?.[currentLocale]?.js,
            I18nOverridesComposer: I18n.overrides?.[currentLocale]?.js?.composer,
            I18nOverridesValue: I18n.overrides?.[currentLocale]?.js?.composer?.[fullKeyName],
            // Check all possible override locations
            allComposerKeys: Object.keys(I18n.translations[currentLocale]?.js?.composer || {}),
            allComposerValues: Object.entries(I18n.translations[currentLocale]?.js?.composer || {}).filter(([k]) => k.includes('wb_')),
            // Check if I18n has override methods
            I18nStructure: {
              hasOverrides: !!I18n.overrides,
              overrideKeys: I18n.overrides ? Object.keys(I18n.overrides) : [],
              hasTranslations: !!I18n.translations,
              translationKeys: I18n.translations ? Object.keys(I18n.translations) : []
            }
          };
          
          console.log("[WB Composer Placeholders] ===== RUNTIME DEEP INSPECTION =====", runtimeInspection);
          
          // Try to get translation via I18n.t() first - this should respect theme translation overrides
          // Check BEFORE we set any defaults to see if override exists
          // Try multiple times with a small delay to catch async-loaded overrides
          let translated = I18n.t(translationKey);
          let translatedFullPath = I18n.t(`js.${translationKey}`);
          
          // Check if I18n.t() returned the "missing translation" format [locale.key]
          // This means the translation doesn't exist and we need to set a default
          let isMissingTranslation = translated.startsWith(`[${currentLocale}.`) && translated.endsWith(']');
          let isMissingFullPath = translatedFullPath.startsWith(`[${currentLocale}.`) && translatedFullPath.endsWith(']');
          
          // If missing, wait a bit and check again (theme overrides might load asynchronously)
          if (isMissingTranslation && isMissingFullPath) {
            // Use a microtask to check again after current execution
            Promise.resolve().then(() => {
              const retryTranslated = I18n.t(translationKey);
              const retryTranslatedFull = I18n.t(`js.${translationKey}`);
              const retryDirect = I18n.translations[currentLocale]?.js?.composer?.[fullKeyName];
              
              if (!retryTranslated.startsWith(`[${currentLocale}.`) || 
                  !retryTranslatedFull.startsWith(`[${currentLocale}.`) || 
                  retryDirect) {
                console.log("[WB Composer Placeholders] Override found on retry:", {
                  translationKey,
                  retryTranslated,
                  retryTranslatedFull,
                  retryDirect,
                  note: "Override loaded asynchronously - will be used on next call"
                });
              }
            });
          }
          
          // Deep check for theme translation overrides
          const directAccess = I18n.translations[currentLocale]?.js?.composer?.[fullKeyName];
          
          // Check if there's a theme override system (Discourse might store theme overrides separately)
          // Also check window.Discourse for theme settings
          const themeOverrideCheck = {
            hasI18nExtras: typeof I18n.extras !== 'undefined',
            hasI18nMissing: typeof I18n.missing !== 'undefined',
            hasI18nLookup: typeof I18n.lookup === 'function',
            lookupResult: typeof I18n.lookup === 'function' ? I18n.lookup(translationKey, { locale: currentLocale }) : null,
            lookupResultFull: typeof I18n.lookup === 'function' ? I18n.lookup(`js.${translationKey}`, { locale: currentLocale }) : null,
            // Check all possible I18n properties
            I18nKeys: Object.keys(I18n).filter(k => !k.startsWith('_')),
            // Check if there's a translations_override or similar
            hasTranslationsOverride: typeof I18n.translations_override !== 'undefined',
            translationsOverride: I18n.translations_override?.[currentLocale]?.js?.composer?.[fullKeyName],
            // Check Discourse global object
            hasDiscourse: typeof window.Discourse !== 'undefined',
            DiscourseKeys: typeof window.Discourse !== 'undefined' ? Object.keys(window.Discourse) : [],
            // Check if there's a SiteSettings or similar
            hasSiteSettings: typeof window.SiteSettings !== 'undefined',
            // Check for theme translations in different locations
            I18nAllLocales: I18n.translations ? Object.keys(I18n.translations) : [],
            // Try to find the override by searching all locales
            searchAllLocales: I18n.translations ? Object.keys(I18n.translations).map(loc => ({
              locale: loc,
              value: I18n.translations[loc]?.js?.composer?.[fullKeyName]
            })).filter(x => x.value) : []
          };
          
          // Also try to access via the component's API if available
          // Check if we can get theme translations from the component context
          let componentThemeOverride = null;
          try {
            // Try to access via Discourse's theme system
            if (typeof window.Discourse !== 'undefined' && window.Discourse.SiteSettings) {
              // Theme translations might be in a different structure
              console.log("[WB Composer Placeholders] Checking Discourse.SiteSettings for theme translations");
            }
          } catch (e) {
            console.log("[WB Composer Placeholders] Error checking Discourse object:", e);
          }
          
          console.log("[WB Composer Placeholders] ===== THEME OVERRIDE DETECTION =====", {
            translationKey,
            fullPath: `js.${translationKey}`,
            viaI18nT_composer: translated,
            viaI18nT_fullPath: translatedFullPath,
            isMissingTranslation,
            isMissingFullPath,
            directAccess,
            themeOverrideCheck,
            componentThemeOverride,
            recommendation: isMissingTranslation && isMissingFullPath ? "No override found, will set default" : "Override may exist, check values above",
            note: "If override is set in component settings but not found here, it may be loaded asynchronously or stored differently"
          });
          
          // Check if override exists but wasn't found - maybe it's loaded later
          // Try to manually check if I18n.t() with options might work
          let overrideValue = null;
          try {
            // Sometimes overrides are merged into translations but I18n.t() needs to be called differently
            // Try checking if the value exists after a small delay or in a different structure
            const allTranslations = I18n.translations;
            const allLocales = Object.keys(allTranslations || {});
            console.log("[WB Composer Placeholders] Searching all locales for override:", {
              locales: allLocales,
              searchingFor: fullKeyName,
              foundInLocales: allLocales.map(loc => ({
                locale: loc,
                hasJs: !!allTranslations[loc]?.js,
                hasComposer: !!allTranslations[loc]?.js?.composer,
                value: allTranslations[loc]?.js?.composer?.[fullKeyName]
              })).filter(x => x.value)
            });
          } catch (e) {
            console.log("[WB Composer Placeholders] Error searching translations:", e);
          }
          
          // Use the translation that was found (either from override or locale file)
          // If both are missing, use the one that's not missing, or prefer fullPath if available
          const finalTranslated = !isMissingFullPath ? translatedFullPath : (!isMissingTranslation ? translated : null);
          
          // Check one more time right before setting default - overrides might have loaded
          // This is a final check to ensure we don't overwrite an override that just loaded
          const finalCheckTranslated = I18n.t(translationKey);
          const finalCheckTranslatedFull = I18n.t(`js.${translationKey}`);
          const finalCheckDirect = I18n.translations[currentLocale]?.js?.composer?.[fullKeyName];
          const finalIsMissing = finalCheckTranslated.startsWith(`[${currentLocale}.`) && finalCheckTranslated.endsWith(']');
          const finalIsMissingFull = finalCheckTranslatedFull.startsWith(`[${currentLocale}.`) && finalCheckTranslatedFull.endsWith(']');
          
          console.log("[WB Composer Placeholders] Final check before setting default:", {
            translationKey,
            finalCheckTranslated,
            finalCheckTranslatedFull,
            finalCheckDirect,
            finalIsMissing,
            finalIsMissingFull,
            note: "Checking one last time if override loaded"
          });
          
          // Only set default if ALL checks (including final check) show missing
          // This ensures we don't overwrite overrides that loaded between checks
          if (finalIsMissing && finalIsMissingFull && !finalCheckDirect && !themeOverrideCheck.translationsOverride) {
            const defaultValue = currentLang === "en" ? (
              translationKeyName === "pm" ? "Write a private message…" :
              translationKeyName === "topic" ? "Start a new topic…" :
              "Write your reply…"
            ) : (
              translationKeyName === "pm" ? "Напишите личное сообщение…" :
              translationKeyName === "topic" ? "Создайте новую тему…" :
              "Напишите ответ…"
            );
            
            // IMPORTANT: Use ||= instead of = to ensure we don't overwrite if override loaded
            // This is a safety check - if an override loaded between our checks, ||= won't overwrite it
            const existingBeforeSet = I18n.translations[currentLocale].js.composer[fullKeyName];
            I18n.translations[currentLocale].js.composer[fullKeyName] ||= defaultValue;
            const existingAfterSet = I18n.translations[currentLocale].js.composer[fullKeyName];
            
            console.log("[WB Composer Placeholders] Set default translation:", {
              key: fullKeyName,
              translationKey: translationKey,
              valueBeforeSet: existingBeforeSet,
              defaultValueAttempted: defaultValue,
              valueAfterSet: existingAfterSet,
              wasOverwritten: existingBeforeSet && existingBeforeSet !== existingAfterSet,
              reason: existingBeforeSet ? "Override found at last moment, preserved" : "No override found - setting default"
            });
          } else {
            // An override or existing translation was found
            const source = themeOverrideCheck.translationsOverride ? "theme override" :
                          directAccess ? "direct access (locale file or previously set)" :
                          !isMissingFullPath ? "I18n.t() full path" :
                          !isMissingTranslation ? "I18n.t() composer path" : "unknown";
            
            console.log("[WB Composer Placeholders] Using existing translation:", {
              source: source,
              value: finalTranslated || directAccess || themeOverrideCheck.translationsOverride,
              translationKey: translationKey,
              note: "Override or locale file translation found - using it"
            });
            
            // If we found a translation via I18n.t() but it's not in direct access, 
            // make sure it's stored so future calls work
            if (finalTranslated && !isMissingTranslation && !directAccess) {
              I18n.translations[currentLocale].js.composer[fullKeyName] = finalTranslated;
              console.log("[WB Composer Placeholders] Cached translation for future use:", finalTranslated);
            }
          }
          
          // Verify the translation is now available
          const finalValue = I18n.translations[currentLocale]?.js?.composer?.[fullKeyName];
          const verifyI18nT = I18n.t(translationKey);
          const verifyI18nTFull = I18n.t(`js.${translationKey}`);
          
          console.log("[WB Composer Placeholders] ===== FINAL TRANSLATION RESOLUTION =====", {
            translationKey,
            translationKeyName,
            directAccess: finalValue,
            viaI18nT_composer: verifyI18nT,
            viaI18nT_fullPath: verifyI18nTFull,
            wasMissing: isMissingTranslation && isMissingFullPath,
            themeOverrideFound: !!themeOverrideCheck.translationsOverride,
            finalTranslation: finalValue || verifyI18nTFull || verifyI18nT,
            note: (isMissingTranslation && isMissingFullPath) ? "Default was set" : 
                  themeOverrideCheck.translationsOverride ? "Theme override used" :
                  finalValue ? "Translation found (locale file or cached)" : 
                  "Using I18n.t() result"
          });
          
          // Return the translation key - the component will call I18n.t() on it
          // Now that we've ensured the translation exists, I18n.t() will find it
          return translationKey;
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

