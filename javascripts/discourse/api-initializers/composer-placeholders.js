import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";
import { themePrefix } from "discourse/lib/theme-prefix";

/**
 * WB Composer Placeholders
 *
 * Goal:
 * - Use ONLY theme translations (locales/*.yml + overrides in the Theme UI “yellow boxes”).
 * - Do NOT write into I18n.translations at runtime (that tends to bypass/override the theme UI).
 * - Apply only for EN/RU, keep core behavior intact for other locales.
 *
 * Expected locale keys in your theme component:
 *
 * en:
 *   js:
 *     composer:
 *       wb_reply_placeholder: "..."
 *       wb_topic_placeholder: "..."
 *       wb_pm_placeholder: "..."
 *
 * ru:
 *   js:
 *     composer:
 *       wb_reply_placeholder: "..."
 *       wb_topic_placeholder: "..."
 *       wb_pm_placeholder: "..."
 *
 * In Admin → Customize → Themes → (your component) → Translations,
 * override these keys:
 * - js.composer.wb_reply_placeholder
 * - js.composer.wb_topic_placeholder
 * - js.composer.wb_pm_placeholder
 */

const DEBUG = false;
const LOG = (...args) => DEBUG && console.log("[WB Composer Placeholders]", ...args);

function currentLang() {
  try {
    const loc = typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "";
    return String(loc || "").split(/[-_]/)[0] || "";
  } catch {
    return "";
  }
}

function enabledForLocale() {
  const lang = currentLang();
  return lang === "en" || lang === "ru";
}

function keyForContext({ creatingTopic, replyingToTopic, privateMessage, action }) {
  const isPm = !!privateMessage || action === "createPrivateMessage";

  if (isPm) return themePrefix("js.composer.wb_pm_placeholder");
  if (creatingTopic) return themePrefix("js.composer.wb_topic_placeholder");
  if (replyingToTopic) return themePrefix("js.composer.wb_reply_placeholder");

  // Default fallback: treat as reply
  return themePrefix("js.composer.wb_reply_placeholder");
}

export default apiInitializer("1.8.0", (api) => {
  LOG("initializer loaded", {
    locale: typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "N/A",
  });

  api.modifyClass("component:composer-editor", (Superclass) => {
    if (!Superclass) return;

    return class extends Superclass {
      @discourseComputed(
        "composer.model.creatingTopic",
        "composer.model.replyingToTopic",
        "composer.model.privateMessage",
        "composer.model.action"
      )
      replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action) {
        // For non EN/RU locales keep core placeholder behavior intact.
        if (!enabledForLocale()) {
          return super.replyPlaceholder(...arguments);
        }

        const model = this.composer?.model;

        // Prefer args, fallback to model (defensive)
        const ctx = {
          creatingTopic: creatingTopic ?? model?.creatingTopic ?? false,
          replyingToTopic: replyingToTopic ?? model?.replyingToTopic ?? false,
          privateMessage: privateMessage ?? model?.privateMessage ?? false,
          action: action ?? model?.action,
        };

        const key = keyForContext(ctx);

        LOG("replyPlaceholder ctx", ctx);
        LOG("replyPlaceholder key", key);
        LOG("replyPlaceholder translated preview", I18n?.t ? I18n.t(key) : "(no I18n.t)");

        return key;
      }
    };
  });
});
