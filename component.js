import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

export default apiInitializer("1.8.0", (api) => {
  const locale = I18n.currentLocale() || "";
  const lang = String(locale).split(/[-_]/)[0]; // "en", "ru", etc.
  const enabled = lang === "en" || lang === "ru";

  // Only define translations for EN/RU. Other locales stay untouched.
  if (enabled) {
    I18n.translations[locale] ||= {};
    I18n.translations[locale].js ||= {};
    I18n.translations[locale].js.composer ||= {};

    if (lang === "en") {
      I18n.translations[locale].js.composer.wb_reply_placeholder = "Write your reply…";
      I18n.translations[locale].js.composer.wb_topic_placeholder = "Start a new topic…";
      I18n.translations[locale].js.composer.wb_pm_placeholder = "Write a private message…";
    }

    if (lang === "ru") {
      I18n.translations[locale].js.composer.wb_reply_placeholder = "Напишите ответ…";
      I18n.translations[locale].js.composer.wb_topic_placeholder = "Создайте новую тему…";
      I18n.translations[locale].js.composer.wb_pm_placeholder = "Напишите личное сообщение…";
    }
  }

  api.modifyClass("component:composer-editor", (Superclass) =>
    class extends Superclass {
      @discourseComputed(
        "composer.model.creatingTopic",
        "composer.model.replyingToTopic",
        "composer.model.privateMessage",
        "composer.model.action"
      )
      replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action) {
        // For non EN/RU locales keep core placeholder behavior intact.
        if (!enabled) {
          return super.replyPlaceholder(...arguments);
        }

        const isPm = !!privateMessage || action === "createPrivateMessage";
        if (isPm) return "composer.wb_pm_placeholder";
        if (creatingTopic) return "composer.wb_topic_placeholder";
        if (replyingToTopic) return "composer.wb_reply_placeholder";

        return "composer.wb_reply_placeholder";
      }
    }
  );
});

