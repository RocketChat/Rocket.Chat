---
status: planned
adrs: []
code:
  [
    src/Message/MessageToolbarHolder.tsx,
    src/Message/toolbar,
    src/Message/contexts/MessageToolbarContext.ts,
    src/Message/contexts/MessageNavigationContext.ts,
    src/Message/index.ts,
    apps/meteor/client/providers/MessagesProvider/useMessageNavigationValue.ts,
  ]
tests:
  [
    src/Message/MessageToolbarHolder.spec.tsx,
    src/Message/toolbar/MessageToolbar.spec.tsx,
    src/Message/toolbar/MessageToolbarActionMenu.spec.tsx,
    src/Message/toolbar/items/actions/ForwardMessageAction.spec.tsx,
    src/index.spec.ts,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx,
  ]
---

# Spec: Message toolbar

## Summary

The package renders the toolbar of a message: the inline items that show on hover or focus, which depend on the
place the message is in, and the "More" and AI menus. It takes what it needs from the app through the message
contexts and the toolbar context. `apps/meteor` supplies the toolbar context from `MessagesProvider` and renders the
package's toolbar holder from its message variants.

## Motivation

See [the intent](../intents/message-toolbar.md). The app's toolbar reads the app directly, so which items a place
shows, and under which gate, could only be checked by running the client.

## Behaviour

**When the toolbar is there**

- **R1** `MessageToolbarHolder` MUST render nothing where messages do not allow interaction, and MUST NOT look up the
  message's conversation there.
- **R2** Where messages allow interaction, the holder MUST render the toolbar, a `toolbar` named by the translation of
  `Message_actions`, only after the message's room is known, and only while the message is on screen or one of the
  toolbar's popups is open.
- **R3** While a popup of the toolbar is open (the "More" menu, the AI menu or the emoji picker opened from the toolbar)
  the holder MUST keep the toolbar shown even when the message leaves the screen, and MUST let it go when the popup
  closes. (Message hover and focus are styling of the wrapper; their proof is the manual check.)

**The inline items of each place**

- **R4** The toolbar MUST show these inline items, in this order, for the place it is given: `message`: reaction, quote,
  reply in thread, forward; `message-mobile`: the same and jump to the message; `threads`: reaction, quote, forward, jump;
  `videoconf`: reaction, reply in thread; `videoconf-threads`: reaction, jump; `federated`: reaction, quote, reply in
  thread; `pinned`, `starred`, `mentions` and `search`: jump; `direct`: jump, only when the viewer is subscribed to the
  room. A reaction is its quick reactions followed by the button that adds one.
- **R5** Without a place, the toolbar MUST use `videoconf` for a video conference message, else `federated` in a
  federated room, else `threads` for a message of a thread, else `message`. A given place MUST win.
- **R6** The reaction items MUST NOT show for a viewer who is not logged in, in a room of the omnichannel, where the
  viewer has no subscription, on a private message, or in a federated room that is not natively federated. They MUST NOT
  show either where the viewer cannot post in the room (the room is read-only without `post-readonly` for the viewer and
  not `reactWhenReadOnly`, or the viewer is muted), unless the room allows reactions when read-only. The quick reactions
  and the button that adds one MUST NOT show either where the toolbar context says that the place offers no reactions
  (`useQuickReactions` gives no list at all).
- **R7** Quote MUST NOT show without a subscription or in a federated room that is not natively federated. Reply in
  thread MUST NOT show when the `Threads_enabled` setting is off, in the omnichannel, without a subscription, or in such
  a federated room.
- **R8** Forward MUST be disabled, with a name that says why, for an end-to-end encrypted message and in a room with
  ABAC attributes, and MUST otherwise open the forward modal for the message through `openForward`.
- **R9** Each quick reaction the toolbar context offers MUST show as a button named by its emoji, and activating it MUST
  call `toggleReaction` with the message and `:emoji:` and tell the toolbar context that the quick reaction was used.
  The button that adds a reaction, named by the translation of `Add_Reaction`, MUST call `openReactionPicker` with the
  message and a way to learn that the picker closed. How many quick reactions are offered is R21's.
- **R10** Quote MUST call `quote` with the message; reply in thread MUST call `replyInThread` with the message; jump
  MUST call `jumpToMessage` with the message.
- **R11** An inline item whose id the layout hides (`useLayoutHiddenActions().messageToolbox`) MUST NOT show.

**The menus**

- **R12** The "More" menu, named by the translation of `More`, MUST list the entries of the toolbar context that belong
  to the place and are not hidden by the layout, ordered by their `order`, in sections by their type, with the
  actions of apps last in one section titled by the translation of `Apps`.
- **R13** An entry that the layout hides MUST NOT show, but the actions of apps are not hidden by the layout.
- **R14** The "More" menu MUST show when only apps offer an action, and MUST NOT show when nothing is offered. A change
  of the app: before, the menu was hidden when only apps offered an action.
- **R15** On an end-to-end encrypted message the section of apps, in the "More" menu and in the AI menu, MUST be
  replaced by one disabled item "Unavailable" whose tooltip says that the action is not available on encrypted
  content.
- **R16** The AI menu, named by the translation of `AI_Actions`, MUST show only when the toolbar context offers AI
  actions, and MUST list them.
- **R17** Opening or closing either menu MUST tell the holder (R3).
- **R18** Choosing a menu entry MUST run its `action`.

**What the app provides**

- **R19** `MessagesProvider` MUST offer the "More" entries of the app in the places each is declared for, gated as
  they were: starting a discussion, pin and unpin, star and unstar, copy link (for the starred, pinned and other
  places), follow and unfollow a thread, mark unread, translate and view the original, reply in a direct message, copy
  text, edit, delete, report, show the reactions, and the read receipts, which show only when the
  `Message_Read_Receipt_Enabled` and `Message_Read_Receipt_Store_Users` settings are on and, in a federated room, the
  federation receipts setting is. Starting a discussion MUST NOT be offered to someone outside the parent room.
- **R20** `MessagesProvider` MUST append the actions of the installed apps for the place to the "More" entries, and
  MUST offer the apps' actions of the AI category to the AI menu.
- **R21** `MessagesProvider` MUST offer the first three quick reactions of the emoji picker that the app can render,
  and none where the app has no emoji picker. Where no chat is open, it MUST say that the place offers no reactions
  (R6), as the app's toolbar showed none there. Using a quick reaction MUST raise that emoji's frequency count, which
  chooses the quick reactions, as before, and MUST NOT add it to the recent emoji list; the emoji picker's own picks
  still do both. A change of the app: before, a quick reaction was also added to the recent list.
- **R22** The toolbar value MUST keep its identity while the read receipt settings, the quick reactions and whether a
  chat is open stay the same, so that a change of one message does not render every toolbar again.
- **R23** `openReactionPicker` MUST tell that the picker closed, also when it could not open, so that a toolbar is never
  held open for a picker that is not there. `replyInThread` MUST open the thread of the message, `tmid` or else its id,
  in the current room's route, and MUST drop the search parameters of the URL, as the toolbar did.
- **R24** Pinning, starring, unpinning, unstarring, marking unread and translating MUST be carried out through the app,
  also from the toolbar's menu, with the same endpoints and effects as before. (This is the proof that
  `message-capabilities` R28 deferred.)

**Where the toolbar shows in the app**

- **R25** The room's message, in the room, in a thread, in the pinned, starred and mentions tabs and in search, and the
  thread's message MUST render the package's toolbar for their place, not for a private message, an end-to-end encrypted
  message that is still pending, or while messages are being selected.
- **R26** Read-only places (audit, moderation, contact history, the modals and the composer's quote) MUST show no
  toolbar.

**Exports and accessibility**

- **R27** The package MUST export `MessageToolbarHolder` and the toolbar context's value types.
- **R28** Every story of the toolbar MUST pass an axe check with no violations.

## Design

Decided in the plan.

## Out of scope

- The message variants, the list, scrolling and virtualization: later capabilities.
- The hover and focus styling of the toolbar, which belongs to Fuselage.
- The `pin`, `star`, `unstar`, `unpin`, `markUnread`, `translate` and `showOriginal` capabilities of the interactions
  context are carried out by the app but the toolbar's menu entries use the app's own action hooks, so the package
  calls none of them (see R24).

## Known defects

None; not implemented.

## Open questions

- **Q1** ~~Whether a menu holding only app actions is shown.~~ Answered: yes (R14).
- **Q2** ~~Whether a quick reaction adds to the recent emoji list.~~ Answered: no (R21).
- **Q3** ~~Whether "reply in thread" keeps the search parameters.~~ Answered: no, as before (R23).
- **Q4** ~~Whether apps' actions are hidden by the layout.~~ Answered: no, as before (R13).

## References

- [Intent](../intents/message-toolbar.md)
- [message-capabilities](message-capabilities.md) R28, R32
- WCAG 2.1 AA, for R28 (a package decision for how it is checked: axe over the stories)
