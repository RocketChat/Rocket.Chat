# Building a message list

`MessageList` in `@rocket.chat/ui-client` renders any infinite list of messages: a room, a thread, or a read-only list. What it does and the model behind it are in [features/message-list](../features/message-list/README.md); this page is about using and changing it.

## Composing a list

```tsx
<MessageList
	key={rid} // the list restores a position only on mount
	aria-label={t('Message_list')}
	messages={messages} // sorted oldest first
	hasOlderMessages={hasOlder}
	hasNewerMessages={hasNewer}
	isLoadingInitialMessages={isLoading}
	isLoadingOlderMessages={isFetchingOlder}
	isLoadingNewerMessages={isFetchingNewer}
	onLoadOlderMessages={fetchOlder} // returns a promise
	onLoadNewerMessages={fetchNewer}
	onJumpToLatest={jumpToLatest}
	firstUnreadMessageId={firstUnreadId}
	targetMessageId={jumpTarget}
	onTargetMessageReached={clearJumpTarget}
	isOwnMessage={(message) => message.u._id === uid}
	restoredPosition={savedPosition}
	onPositionChange={savePosition}
	onVisibleMessagesChange={reportVisibility}
	header={<RoomForeword room={room} />}
	renderMessage={(row) => <RoomMessage message={row.message} sequential={row.isSequential} /* … */ />}
>
	<MessageListDateBubble />
	<MessageListNewMessagesButton onClick={focusComposer} />
	<MessageListJumpToLatestButton />
</MessageList>
```

- `renderMessage` receives a row: the message, the previous one, whether it is grouped (`isSequential`), whether it starts a day and whether it is the first unread message. The list draws the day and unread dividers itself.
- The overlays are children. Leave out the ones a list does not need; a thread shows only the date.
- `header` shows once no older messages remain. A thread passes its main message as the first message instead, so a jump to it is an ordinary jump.
- The `ref` handle scrolls to the bottom, the top or a message, and returns the latest visibility for callers that ask instead of listening.

## Feeding it

- **A store of loaded messages** (the room): pass the window the store holds, the flags of the history manager, and promises from its loaders. A jump to an unloaded message loads the messages around it; set `targetMessageId` and the list jumps once they arrive.
- **A React Query infinite query** (a thread): `fetchPreviousPage` and `fetchNextPage` are the loaders, `isFetchingPreviousPage` and `isFetchingNextPage` the flags.
- **A read-only list** (an audit, a search result): pass the messages and nothing else; no loaders, no own messages, no position.

The load callbacks must settle once the new page is in `messages`, or once loading failed. The list loads one page at a time and checks again after each change, so a callback that never settles stops paging.

## Rules that keep it correct

- **Never write `scrollTop`.** The virtualizer re-resolves its scroll target for a while after each change and reverts a direct write. Scroll through the list's handle, or add an event to the scroll reducer.
- **Never add index arithmetic.** Go through the rows (`indexOfMessage`); the header and loaders are rows, and offsets computed elsewhere drift.
- **A new scroll behavior is a reducer event**, with a row in the reducer's table test and a story play test that checks it in a browser.
- **Message components call context capabilities**, named for what the user does, never endpoints, stores or the router. See [message-components](../features/message-list/message-components.md).
- **Keep mounted only what holds a live browser resource** (players, iframes). Every kept row is rendered even when far out of view.

## Adding a capability to a message context

1. Add it to the context's value type, named for the user's intent (`followThread(message)`, not `callFollowEndpoint`), with a no-op or sensible default in the context's default value.
2. Use it from the component through the context's hook.
3. Provide it from the app's provider for each place that shows messages, and from the read-only providers if it makes sense there.
4. In the component's spec, wrap with `mockMessageProviders` (`packages/ui-client/tests/utils`), which turns every navigation and interaction capability into a `jest.fn`, and assert it is called with the right arguments.

## Testing

| Level | Covers | Where |
| --- | --- | --- |
| model | rows and indexes, grouping, how a change is classified, geometry, position validation | `MessageList/lib/*.spec.ts` |
| reducer | every anchor and phase transition as a table of events in and commands out | `messageListScrollReducer.spec.ts` |
| components | rows, dividers, header, loaders, overlays, aria, selection, keyboard, axe over every story | `*.spec.tsx` |
| real browser | anything that scrolls or measures | story `play` functions, run by `yarn test-storybook` |

jsdom cannot lay out a virtualized list, so component specs mock the module that wraps the virtualizer with a renderer that renders every row:

```ts
jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'));
```

Keyboard behavior is checked with `expectListKeyboard` (`packages/ui-client/tests/utils/listContract.ts`), as for every list ([list-keyboard-navigation](list-keyboard-navigation.md)).

Play tests in `MessageList.stories.tsx` use the helpers in `MessageList/stories/playHelpers.ts`:

- `waitForListSettled` waits until the scroll position, the content height and the list's anchor and phase stayed the same for a few frames;
- assertions are geometric: the first visible message keeps its offset within a pixel across a prepend; a jump target is centered within a pixel;
- `userScrollTo` scrolls as the viewer does, a wheel event and then the position, since only user input releases an anchor;
- the fake source controls latency, so a test can hold a load open (`latency: 'manual'`) and settle it when it wants.

## The playground

`Components/MessageList` in the ui-client Storybook (`yarn workspace @rocket.chat/ui-client storybook`) runs the list against a simulated server: configurable history, page size and latency, mixed message heights with content that resizes late, and buttons to receive messages, send your own, jump around, resize the container and the composer, and settle held loads. Each story is one behavior; walk them for manual QA.
