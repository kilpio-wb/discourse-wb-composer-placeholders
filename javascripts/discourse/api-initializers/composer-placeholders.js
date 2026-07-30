import { apiInitializer } from "discourse/lib/api";
import { i18n } from "discourse-i18n";

// Discourse's composer (frontend/discourse/app/components/composer-editor.gjs) builds the
// editor placeholder as an i18n KEY, runs it through the "composer-editor-reply-placeholder"
// value transformer, then translates it. The transformer's `context.model` is the composer
// SERVICE (`@service composer`), so the actual Composer model is `context.model.model`.
//
// Keys live in locales/<locale>.yml as:
//   <locale>:
//     composer:
//       wb_reply_placeholder: "..."
//       wb_topic_placeholder: "..."
//       wb_pm_placeholder: "..."
// and can be overridden per-site in Admin > Customize > Themes > (this component) > Edit
// translations (e.g. set composer.wb_topic_placeholder to a longer prompt).

export default apiInitializer((api) => {
  const currentUser = api.getCurrentUser();
  // "Our" people compose PMs as part of their work (to a colleague, or to a client after
  // adding @support), so they should see the stock placeholder — NOT the "we don't answer
  // in PMs" warning, which is aimed at clients.
  //
  // Which groups count is a theme setting (`pm_warning_exempt_groups`, a "|"-separated list
  // of group NAMES) rather than a constant in here: group ids are site-specific, and a
  // mismatch would silently show staff the client warning with nothing in the logs.
  // Matching by name keeps it readable, and the setting is visible/editable in
  // Admin > Customize > Themes > this component, so it can be fixed without a redeploy.
  const exemptGroups = (
    typeof settings !== "undefined" ? settings.pm_warning_exempt_groups || "" : ""
  )
    .split("|")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  // `staff` covers admins/moderators even if the setting is emptied by mistake.
  const isOurStaff =
    !!currentUser?.staff ||
    !!currentUser?.groups?.some((g) =>
      exemptGroups.includes(String(g.name || "").toLowerCase())
    );

  api.registerValueTransformer(
    "composer-editor-reply-placeholder",
    ({ value, context }) => {
      // `themePrefix` is injected into theme JS; bail out (keep Discourse's default) if it isn't.
      if (typeof themePrefix !== "function") {
        return value;
      }

      // context.model is the composer service; its `.model` is the Composer model.
      // (Fall back to context.model itself in case a future version passes the model directly.)
      const composerModel = context?.model?.model ?? context?.model;
      // Don't touch the placeholder if there's no model, or while editing an existing post.
      if (!composerModel || composerModel.editingPost) {
        return value;
      }

      let suffix;
      if (composerModel.privateMessage || composerModel.creatingPrivateMessage) {
        // The PM warning is for clients only; staff see the stock placeholder.
        if (isOurStaff) {
          return value;
        }
        suffix = "wb_pm_placeholder"; // composing a new PM, or replying inside a PM
      } else if (composerModel.creatingTopic) {
        suffix = "wb_topic_placeholder"; // composing a new topic
      } else {
        suffix = "wb_reply_placeholder"; // replying to a topic (and any other context)
      }

      const key = themePrefix(`composer.${suffix}`);

      // Only use our key if it actually resolves to a translation (locale file or override);
      // otherwise fall back to Discourse's stock placeholder.
      const resolved = i18n(key);
      if (typeof resolved !== "string" || resolved === key || resolved.startsWith("[")) {
        return value;
      }
      return key;
    }
  );
});
