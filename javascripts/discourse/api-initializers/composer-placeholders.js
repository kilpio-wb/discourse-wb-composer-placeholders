import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

const DEBUG = (() => {
  try {
    const w = typeof window !== "undefined" ? window : null;
    const q = w?.location?.search || "";
    const ls = w?.localStorage?.getItem("wbComposerPlaceholdersDebug");
    return ls === "1" || /(^|[?&])wbComposerPlaceholdersDebug=1(&|$)/.test(q);
  } catch {
    return false;
  }
})();

const log = (...args) => DEBUG && console.log("[WB Composer Placeholders]", ...args);

function getLocaleLang() {
  try {
    const locale = typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "";
    const lang = String(locale || "").split(/[-_]/)[0] || "";
    return { locale, lang };
  } catch {
    return { locale: "", lang: "" };
  }
}

function tForLocale(locale, key) {
  if (!locale || !key || typeof I18n?.t !== "function") return undefined;

  // Prefer per-call locale if supported; fall back to temporary global switch.
  try {
    const v = I18n.t(key, { locale, defaultValue: null });
    if (v != null) return v;
  } catch {
    // ignore
  }

  const hadLocale = Object.prototype.hasOwnProperty.call(I18n, "locale");
  const oldLocale = I18n.locale;

  try {
    if (hadLocale) I18n.locale = locale;
    return I18n.t(key, { defaultValue: null });
  } catch {
    return undefined;
  } finally {
    if (hadLocale) I18n.locale = oldLocale;
  }
}

function hasNonEmptyTranslation(locale, lang, key) {
  const v = tForLocale(locale, key);

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return false;

    const loc = String(locale || "").toLowerCase();
    const base = String(lang || "").toLowerCase();
    const isEnglish = loc === "en" || loc.startsWith("en-") || loc.startsWith("en_") || base === "en";

    if (isEnglish) return true;

    const en = tForLocale("en", key) ?? tForLocale("en_US", key) ?? tForLocale("en-US", key);
    if (typeof en === "string") return s !== en.trim();

    return true;
  }

  return v != null;
}

function keyForContext({ creatingTopic, replyingToTopic, privateMessage, action }) {
  if (typeof themePrefix !== "function") {
    console.error("[WB Composer Placeholders] themePrefix not available");
    return null;
  }

  const isPm = !!privateMessage || action === "createPrivateMessage";

  if (isPm) return themePrefix("js.composer.wb_pm_placeholder");
  if (creatingTopic) return themePrefix("js.composer.wb_topic_placeholder");
  if (replyingToTopic) return themePrefix("js.composer.wb_reply_placeholder");

  return themePrefix("js.composer.wb_reply_placeholder");
}

export default apiInitializer("1.8.0", (api) => {
  log("MODULE LOADED");

  if (typeof themePrefix !== "function") {
    console.error("[WB Composer Placeholders] themePrefix not available, component disabled");
    return;
  }

  try {
    api.modifyClass("component:composer-editor", (Superclass) => {
      if (!Superclass) {
        console.warn("[WB Composer Placeholders] composer-editor component not found");
        return;
      }

      return class extends Superclass {
        @discourseComputed(
          "composer.model.creatingTopic",
          "composer.model.replyingToTopic",
          "composer.model.privateMessage",
          "composer.model.action"
        )
        replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action) {
          if (!I18n || typeof I18n.currentLocale !== "function") {
            log("I18n missing, using super");
            const s = super.replyPlaceholder;
            return typeof s === "function"
              ? s.call(this, creatingTopic, replyingToTopic, privateMessage, action)
              : s;
          }

          const { locale, lang } = getLocaleLang();

          const model = this.composer?.model;

          const ctx = {
            creatingTopic: creatingTopic ?? model?.creatingTopic ?? false,
            replyingToTopic: replyingToTopic ?? model?.replyingToTopic ?? false,
            privateMessage: privateMessage ?? model?.privateMessage ?? false,
            action: action ?? model?.action,
          };

          const key = keyForContext(ctx);

          if (!key || !hasNonEmptyTranslation(locale, lang, key)) {
            const s = super.replyPlaceholder;
            return typeof s === "function"
              ? s.call(this, creatingTopic, replyingToTopic, privateMessage, action)
              : s;
          }

          log("replyPlaceholder ctx", { locale, lang, ...ctx });
          log("replyPlaceholder key", key);

          return key;
        }
      };
    });
  } catch (error) {
    console.error("[WB Composer Placeholders] Failed to modify composer-editor:", error);
    console.error("[WB Composer Placeholders] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
});