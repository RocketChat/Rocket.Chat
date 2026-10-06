# Emoji suggestions and quick reactions

## Overview

Two places offer emojis without searching for them:

- the **emoji picker** opens on _Frequently used_ (the user's own picks) followed by _Suggested_, a set of emojis the
  workspace recommends for day-to-day work (✅ 👀 🙌 🙏 👍 🎉 🚀 and so on);
- the **message toolbar** shows five quick reactions. Hovering them opens a second line under the toolbar with more.

Both draw on the same suggested list, so changing it changes both.

## Suggested emojis

The list is fixed in the client for now. The goal is for workspace admins to curate it;
until a setting stores it, every workspace gets the default. It lives in the `suggested` category of the `base` emoji
package, next to `recent`, so anything that replaces the list only has to write that category and dispatch an emoji
update.

Entries are emoji names without a tone. Wherever they are shown or picked, they take the user's skin tone, the same
way a pick from any native category does. A custom emoji with the same name as a native one replaces it, as it does
everywhere else, and never takes a tone. Entries that don't resolve to an emoji (e.g. a deleted custom emoji) are
skipped.

_Frequently used_ is different: it holds the user's picks as they were made, tone included, so it is rendered as stored.

## Quick reactions

The toolbar's reactions are one ordered list: the user's frequent emojis (by usage score, kept in local storage per
browser), then the suggested ones not already among them. A user who has never reacted therefore still sees five
reactions, all suggestions.

- The first five are always visible.
- Hovering them for a moment, or reaching them with the keyboard, opens a line hanging from the toolbar, as wide as
  it, holding as many of the remaining reactions as fit — the slots line up with the toolbar's buttons.
- The line stays open while the pointer is over the reactions or the line itself, and closes shortly after it leaves,
  when keyboard focus leaves them, or on Escape (which returns focus to the first reaction if it was in the line).
- In keyboard order the line comes right after the five reactions, before the other toolbar actions.

Touch devices have no hover, so they only get the five.

## Key Files

| Layer                                                       | File                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Suggested list                                              | `apps/meteor/client/lib/emoji/suggested.ts`                                                            |
| `base` package with the `recent` and `suggested` categories | `apps/meteor/client/lib/emoji/lib.ts`                                                                  |
| Tone resolution, picker rows, quick reaction list           | `apps/meteor/client/lib/emoji/helpers.ts` (`getEmojiWithTone`, `createEmojiList`, `getQuickReactions`) |
| Frequent emojis and quick reactions state                   | `apps/meteor/client/providers/EmojiPickerProvider/EmojiPickerProvider.tsx`                             |
| Picker category icon                                        | `apps/meteor/client/views/composer/EmojiPicker/EmojiPickerCategoryItem.tsx`                            |
| Toolbar reactions and hover/keyboard behavior               | `apps/meteor/client/components/message/toolbar/MessageToolbarQuickReactions.tsx`                       |
| Second line and slot fitting                                | `apps/meteor/client/components/message/toolbar/MessageToolbarMoreQuickReactions.tsx`                   |
| Category label                                              | `packages/i18n/src/locales/en.i18n.json` (`Suggested_emojis`)                                          |
