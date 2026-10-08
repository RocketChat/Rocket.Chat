# Unit tests and stories

Rules for Jest + Testing Library specs and Storybook stories of client code. End-to-end tests have their own guide:
[apps/meteor/tests/e2e/README.md](../../apps/meteor/tests/e2e/README.md).

## Query by role and name

Find elements the way a user or a screen reader does. Interact with `userEvent`, and `await` it.

```tsx
// ❌ breaks on copy changes and markup changes, and passes on inaccessible UI
const { container } = render(<CallControls />);
fireEvent.click(container.querySelector('.rcx-button--mic')!);
expect(screen.getByText('Muted')).toBeInTheDocument();

// ✅
render(<CallControls />, { wrapper: mockAppRoot().build() });
await userEvent.click(screen.getByRole('button', { name: 'Mute microphone' }));
expect(screen.getByRole('button', { name: 'Unmute microphone' })).toBeInTheDocument();
```

`getByText` is fine for plain text that has no role (a paragraph, a status line). `getByTestId` is a last resort.

## Fake dependencies through providers, not `jest.mock`

Components get their dependencies from contexts, so a test supplies them the same way:
`mockAppRoot()` from `@rocket.chat/mock-providers` builds a wrapper with endpoints, settings, permissions,
translations and devices.

```tsx
// ❌ couples the test to the module layout and silently stops mocking after a move
jest.mock('../../hooks/useRoomInfo', () => ({ useRoomInfo: () => ({ data: room }) }));

// ✅
render(<RoomInfo rid='GENERAL' />, {
	wrapper: mockAppRoot()
		.withEndpoint('GET', '/v1/rooms.info', () => ({ room }))
		.withSetting('UI_Use_Real_Name', true)
		.build(),
});
```

`jest.mock` stays acceptable for third-party modules that have no provider (a browser SDK, a worker).

## No global overrides in fixtures

Don't assign `navigator.mediaDevices`, `window.matchMedia` or similar in a fixture. Globals leak between tests, and
code that reads them directly cannot be driven from a story. Put the dependency behind a context and provide it —
`mockAppRoot().withAudioInputDevices(devices)` feeds `DeviceContext`.

## Assert behaviour, not implementation

```ts
// ❌ broke when the emitter's internals changed, though the behaviour did not
expect(emitter.off).toHaveBeenCalledWith('change', handler);

// ✅
unsubscribe();
emitter.emit('change');
expect(handler).not.toHaveBeenCalled();
```

## Every new component has stories

Stories are fed through decorators and providers, the same way the app feeds the component — never by reaching into
modules. Where the package snapshots its stories, add the component to that spec; the shape is
`apps/meteor/client/components/InvitationBadge/InvitationBadge.spec.tsx`: `composeStories`, one snapshot and one
`jest-axe` check per story.

## Keep tests next to their source

`Foo.tsx`, `Foo.spec.tsx`, `Foo.stories.tsx` sit side by side, and a pure function in `lib/foo.ts` has
`lib/foo.spec.ts` (for example `packages/ui-conference/src/lib/memberStatus.spec.ts`).
