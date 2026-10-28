# Building components

A component is a reusable piece of code that represents a single UI element. Components vary by complexity and type, existing at either the **application** level or the **Fuselage library** level:

- **Application components** remain specific to particular Rocket.Chat applications, without cross-application reusability.
- **Fuselage library components** are reusable across all Rocket.Chat applications and represent the recommended approach.

## Component rules matrix

| Combination      | Fuselage level | Application level |
| ---------------- | -------------- | ----------------- |
| Simple & Visual  | ✅             | ❌                |
| Complex & Visual | ✅             | ✅                |
| Simple & Logical | ❌             | ❌                |
| Complex & Logical| ❌             | ✅                |

## Where a component gets its data

This is the hooks-era form of **container/presentational components**: application state is
read at one assembly point — a provider, or the route-level view — and handed to
presentational components through props or [context][react-context]. Dan Abramov, who
popularised the container split, [no longer recommends it as a rigid rule][abramov]; what
survives is the boundary, not the folder layout. Logic lives in hooks and providers,
components receive values and callbacks.

> **Scope.** This is for a screen, or a set of components sharing a situation. A small
> component just takes props — it needs no provider of its own.

The line is the provider, not the package. `useSetting` in a package's provider is fine;
the same call in one of its components is not. The reason is dependencies: every context a
component reads is one more thing a story has to mock, a test has to stand up, and a move
has to carry along. A provider pays that cost once, for the whole screen.

### What a component may read

| Read in the provider (or route-level view) | Fine inside any component |
| --- | --- |
| settings, user preferences, permissions | translation (`useTranslation`) |
| the current user | theme, layout, breakpoints |
| route, router, navigation | the screen's own context, which the provider fills |
| endpoints, streams, queries, mutations | local UI state (`useState`, open/closed, hover) |
| toasts, modals, other app-wide side effects | |

Live per-entity services — presence, user cards, autocompletes that query the server — are
the product's, not the component's. Take them as a [slot](#slots-for-what-belongs-to-the-product).

In this repo: `packages/ui-conference` keeps its provider in the application
(`apps/meteor/client/views/conference/providers/ConferenceProvider.tsx`) and its components
read only the contract. `packages/ui-voip` follows the same split in `providers/` and
`components/`; `DevicePicker.tsx` and `CallHistoryInternalUser.tsx` still read application
contexts and are the exception, not the shape to copy.

### 1. Read application state once, at the assembly point

❌

```tsx
const UserRow = ({ user }: UserRowProps) => {
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const canRemove = usePermission('remove-user');
	const inAdmin = useCurrentRoutePath()?.startsWith('/admin/');
```

✅ — a prop when one component needs it; one group on the provider when a screenful do:

```tsx
type UserRowProps = {
	user: UserSummary;
	useRealName: boolean;
	canRemove: boolean;
};
```

Route and mount location are circumstances too: the provider recognises them and hands
down the consequence (`joinDisabled`), never the path to inspect.

In this repo: `VideoConferenceBlock` reads `joinDisabled` from `VideoConfContext`, and
`VideoConfProvider` is the only place that looks at the route. `ConferenceViewer` in
`packages/ui-conference` groups the settings and permissions a conference screen needs.

### 2. Pass derived values, not raw data

Known as [selectors][redux-selectors] in Redux, a **view model** in MVVM, and the
[Law of Demeter][demeter] in general: a component asks for the fact it needs, not for a
collection to search or an identity to derive from. Raw material leaves the deriving in
the component, where the next component that needs it will write it again — differently.

❌

```tsx
const { selectedIds } = useSelection();
const selected = selectedIds.includes(item.id);
const canEdit = item.ownerId === currentUserId || isAdmin;
```

✅

```tsx
const { selected, canEdit, toggle } = itemState(item.id);
```

Pass an identity only when the component needs who someone *is* — it shows their name, or
keys storage by them — and say so in the prop name.

In this repo: `CallListItem` asks `callRing(call.callId)` for `{ audible, silenced, silence }`.
Target shape, not yet merged: `ConferenceViewer` still carries `uid`, which `CallMemberItem`
and `ChatAccessNotice` derive from; the provider should answer those questions instead.

### 3. Derive, don't sync

React's own guidance is [You Might Not Need an Effect][no-effect]: an effect that only reads
state and writes state is a derivation in disguise. It cannot be tested without rendering,
the rule is scattered across dependency arrays, and the next screen re-implements it. Put
the rule in a plain function — [functional core, imperative shell][fcis] — and keep effects
for reaching outside React.

❌

```tsx
useEffect(() => {
	if (!isPrivate) {
		setValue('encrypted', false);
	}
}, [isPrivate, setValue]);
```

✅

```ts
const { values, editable } = resolveForm(draft, policy);
```

Writing the result into a form library's store is still an effect — that *is* reaching
outside React. Keep it, and keep it branchless; the deciding already happened.

**Check the transition before you delete it.** A rule that clears a field is not always a
mask. Making a room public drops the encryption choice — turn it private again and the
toggle is off, not restored. Rewriting that as a pure "derive the effective value" loses a
decision someone made on purpose. Run the tests that pin it first.

In this repo: `CreateChannelModal` and `CreateTeamModal` still decide room options across
several effects; `resolveForm` above is the target shape.

### 4. Data down, actions up

The name comes from Ember ([DDAU][ddau]); in React it is [callbacks as props][react-events].
A component calls the action it was given and reports what happened. Where to go next, what
to close and what to announce belong to the caller — the only place that knows.

❌

```tsx
await forwardChat(payload);
dispatchToastMessage({ type: 'success', message: t('Transferred') });
router.navigate('/home');
```

✅

```tsx
await onForward({ department, username, comment });
onClose();
```

A toast is the same decision in smaller print: a component that announces its own success
has decided, for every caller it will ever have, that succeeding is worth announcing.

In this repo: `useQuickActions` hands `TranscriptModal` its `onRequest`, `onSend` and
`onDiscard`. `ForwardChatModal` is the ❌ above.

### 5. The test: render it from a plain object

Can this component render from a plain object — no workspace, no router, no server? If not,
whatever stands in the way belongs on the provider. This is the [Humble Object][humble]
pattern: the part that is hard to test (the UI) is kept so thin it needs no test of its
logic, because it has none.

### Slots for what belongs to the product

Some parts are genuinely the product's: a whole room with its composer, live presence, a
people picker that queries the server. Take them as [slots][ioc] — `ReactNode` props or
render props — instead of reimplementing them or reading their contexts.

```ts
type Slots = {
	chat?: ReactNode;
	renderUserStatus?: (uid: string) => ReactNode;
	renderUserPicker?: (props: UserPickerProps) => ReactNode;
};
```

### When the point is a second UI

Everything above buys testability. Swapping the UI asks for more: a **headless** contract,
in the sense of [React Aria's hooks][react-aria] or [TanStack][tanstack] — the provider
carries the *whole* screen, or the alternative UI reimplements whatever was left out.

- **Group the contract by kind of thing**: the entity, the session, `actions`, `slots`,
  `viewer` (the settled settings and permissions).
- **Give it a default value that renders** — not one that throws, which makes every story
  supply the whole contract; not one that fetches, which is the coupling the split removes.
- **Keep the provider in the application**, not in the package that holds the UI.

Leaks to watch for:

- a provider that **renders its own UI**, so mounting the logic hands you the shipped screen
- an action that opens a **specific modal** — deciding to transfer is logic, the modal is not
- **UI vocabulary in the contract**: drag coordinates, or a union naming the surfaces that
  happen to exist today
- a hook in the logic layer returning **icon names or copy**
- a **state → screen mapping that exists only as JSX**, so it cannot be reused or tested

In this repo: `packages/ui-conference` is the shape to copy.

[react-context]: https://react.dev/learn/passing-data-deeply-with-context
[abramov]: https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
[redux-selectors]: https://redux.js.org/usage/deriving-data-selectors
[demeter]: https://en.wikipedia.org/wiki/Law_of_Demeter
[no-effect]: https://react.dev/learn/you-might-not-need-an-effect
[fcis]: https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell
[ddau]: https://guides.emberjs.com/release/components/component-state-and-actions/
[react-events]: https://react.dev/learn/responding-to-events#passing-event-handlers-as-props
[humble]: https://martinfowler.com/bliki/HumbleObject.html
[ioc]: https://kentcdodds.com/blog/inversion-of-control
[react-aria]: https://react-spectrum.adobe.com/react-aria/hooks.html
[tanstack]: https://tanstack.com/table/latest/docs/introduction
[cdd]: https://www.componentdriven.org/
[sb-args]: https://storybook.js.org/docs/writing-stories/args

## Simple components

Simple components represent atomic UI elements like buttons or text fields.

### Prefer variation over styles

Use prop names suggesting component variation rather than style-based props. Instead of `color="blue"`, use `variation="primary"` for improved readability and consistency.

### Avoid hardcoded values or magic numbers

Preferred:

```jsx
<Button small square>
	<Icon name='circle-arrow-down' size='x24' />
</Button>
```

Not recommended:

```jsx
<Button height='50px' width='50px' square>
	<Icon name='circle-arrow-down' size='x24' />
</Button>
```

### Customize via CSS variables

Prioritize CSS variable customization over arbitrary values:

```scss
$modal-margin: theme('modal-margin', auto);

.rcx-modal {
	position: static;
	display: flex;
	width: 100%;
	max-height: 100%;
	margin: $modal-margin;
}
```

### Document variations in Storybook

Display all possible variations with descriptive explanations for non-obvious options.

### Unit test all behaviors

Comprehensive unit tests ensure reliability across all intended scenarios:

```jsx
describe('[Menu Component]', () => {
	it('should renders without crashing', () => {
		render(<Simple {...Simple.args} />);
	});

	it('should open options when click', async () => {
		const { getByTestId } = render(<Simple {...Simple.args} />);
		const button = getByTestId('menu');
		userEvent.click(button);
		expect(await screen.findByText('Make Admin')).toBeInTheDocument();
	});

	it('should have no options when click twice', async () => {
		const { getByTestId } = render(<Simple {...Simple.args} />);
		const button = getByTestId('menu');
		await userEvent.click(button);
		await userEvent.click(button);
		expect(screen.queryByText('Make Admin')).toBeNull();
	});

	it('should have no options when click on menu and then elsewhere', async () => {
		const { getByTestId } = render(<Simple {...Simple.args} />);
		const button = getByTestId('menu');
		await userEvent.click(button);
		await userEvent.click(document.body);
		expect(screen.queryByText('Make Admin')).toBeNull();
	});
});
```

### Avoid "Boxed" components

The `Box` component works as a wildcard primarily for simple or complex components during prototyping. For simple components specifically, construct using HTML tags instead.

## Complex components

Complex components combine multiple simple components for sophisticated UI elements like modals or tables.

### Visual only, no logic

Concentrate solely on the user interface design, ensuring it is poised to incorporate the required logic seamlessly.

What counts as logic, and where it goes instead, is
[Where a component gets its data](#where-a-component-gets-its-data).

```jsx
export const Default = () => (
	<Modal>
		<ModalHeader>
			<ModalHeaderText>
				<ModalTitle>Modal Header</ModalTitle>
			</ModalHeaderText>
			<ModalClose />
		</ModalHeader>
		<ModalContent>Modal Body</ModalContent>
		<ModalFooter>
			<ModalFooterControllers>
				<Button>Cancel</Button>
				<Button primary onClick={action('click')}>
					Submit
				</Button>
			</ModalFooterControllers>
		</ModalFooter>
	</Modal>
);
```

### Split components for clarity

Structure components into understandable, logical segments.

### Develop with Storybook first

This is [Component-Driven Development][cdd]: build the screen bottom-up in isolation,
against a shape you invent — not the endpoint's shape, the screen's. None of it has to
exist yet.

```ts
type CallScreen = {
	members: Member[];
	canRing: boolean;
	ended: boolean;
	name: string;
};
```

Every story then **states a situation** through [args][sb-args] rather than arranging one
by mocking transport:

```tsx
export const Ended: Story = {
	args: { members, name: 'Weekly sync', ended: true, canRing: false },
};
```

A story that mocks endpoints documents the transport, and breaks when the transport
changes. A story that states the situation documents the screen.

**Actions are values too.** `join`, `leave` and `ring` arrive as functions — a story logs
them, a spec asserts a spy, and the component has no idea a server exists.

**Wiring is a separate step**, and can be a separate pull request: the screens land with
their stories, then a second change supplies the reads, the actions and the routes. Land
the wiring right after, so the screens do not sit unreachable on `develop`.

In this repo: the `packages/ui-conference` stories use `withLiveConference({ call, room,
session })`; `ChatAccessModal` asserts `shareChat(mode)` against a spy instead of a mocked
endpoint.

### Child components must remain scoped

❌ Incorrect:

```tsx
export const MyComponent: ComponentStory<typeof VideoConfMessage> = () => (
	<Box display='flex'>
		<form>
			<VideoConfMessageAction>Call ended</VideoConfMessageAction>
		</form>
	</Box>
);
```

✅ Correct:

```tsx
export const MyComponent: ComponentStory<typeof VideoConfMessage> = () => (
	<Box display='flex'>
		<form>
			<VideoConfMessage>
				<VideoConfMessageFooter>
					<VideoConfMessageAction>Call ended</VideoConfMessageAction>
				</VideoConfMessageFooter>
			</VideoConfMessage>
		</form>
	</Box>
);
```

### HTML elements, box, and box props should be encapsulated

Encapsulation ensures predictable behavior and streamlined debugging by accessing HTML elements and Box props solely through the Box component's API.

❌ Incorrect:

```tsx
export const VideoConfMessage = () => (
	<Box mbs='x4' maxWidth='345px' borderWidth={2} borderColor='neutral-200' borderRadius='x4'>
		<Box p='x16' display='flex' alignItems='center'>
			<Icon name='link' />
			<div>My Text</div>
		</Box>
	</Box>
);
```

✅ Correct:

```tsx
export type VideoConfMessageProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessage = (props: VideoConfMessageProps) => (
	<Box mbs='x4' maxWidth='345px' borderWidth={2} borderColor='neutral-200' borderRadius='x4' {...props} />
);
```

### Provide hooks as helpers

In the following example, the `useVideoConfControllers` hook is provided as a helper to manage the state of the popup's controllers:

```ts
export const useVideoConfControllers = (
	initialPreferences: controllersConfigProps = { mic: true, cam: false },
): { controllersConfig: controllersConfigProps; handleToggleMic: () => void; handleToggleCam: () => void } => {
	const [controllersConfig, setControllersConfig] = useState(initialPreferences);

	const handleToggleMic = useCallback((): void => {
		setControllersConfig((prevState) => ({ ...prevState, mic: !prevState.mic }));
	}, []);

	const handleToggleCam = useCallback((): void => {
		setControllersConfig((prevState) => ({ ...prevState, cam: !prevState.cam }));
	}, []);

	return {
		controllersConfig,
		handleToggleMic,
		handleToggleCam,
	};
};
```

```tsx
const { controllersConfig } = useVideoConfControllers();

return (
	<VideoConfPopup>
		<VideoConfPopupHeader>
			<VideoConfPopupTitle text={t('Calling')} counter />
			<VideoConfPopupControllers>
				<VideoConfController
					active={controllersConfig.cam}
					title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
					icon={controllersConfig.cam ? 'video' : 'video-off'}
					disabled
				/>
				<VideoConfController
					active={controllersConfig.mic}
					title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
					icon={controllersConfig.mic ? 'mic' : 'mic-off'}
					disabled
				/>
			</VideoConfPopupControllers>
		</VideoConfPopupHeader>
	</VideoConfPopup>
);
```

## Understanding the component and defining the scope

New components typically emerge from requirements put forth by the Product Design Team. The frontend engineer holds the responsibility of assessing the genuine necessity of such components. Due to the substantial effort involved in creating a new component, it is prudent to collaborate with product managers and designers. It is advisable to explore the feasibility of employing Complex Components as an MVP to validate concepts and user flows. After successful validation, the progression to developing a new Fuselage level component can be considered.

**How do I know my component should be part of the Fuselage library?**

Consider the `VerticalBar` component as a clear example. It began as a Complex Component for a single application but has now advanced to the Fuselage level. This shift is driven by its usefulness in multiple applications, like Rocket.Chat and Cloud Portal. This case demonstrates how components can grow from specific solutions to versatile tools with broader applications.

## Logical components

### Use child components to compose a logical complex component

Leverage the integration of child components to construct a unified and logical complex component:

```tsx
const OutgoingPopup = ({ room, onClose, id }: OutgoingPopupProps): ReactElement => {
	const t = useTranslation();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig } = useVideoConfControllers();

	return (
		<VideoConfPopup>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Calling')} counter />
				<VideoConfPopupControllers>
					<VideoConfController
						active={controllersConfig.cam}
						title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						icon={controllersConfig.cam ? 'video' : 'video-off'}
						disabled
					/>
					<VideoConfController
						active={controllersConfig.mic}
						title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						icon={controllersConfig.mic ? 'mic' : 'mic-off'}
						disabled
					/>
				</VideoConfPopupControllers>
			</VideoConfPopupHeader>
		</VideoConfPopup>
	);
};
```

### Customization through variations

Provide users with the ability to customize a component's appearance or behavior by selecting from predefined variations or options. This approach enhances user experience and flexibility in adapting components to specific requirements.

```tsx
<VideoConfController
	active={controllersConfig.mic}
	title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
	icon={controllersConfig.mic ? 'mic' : 'mic-off'}
	disabled
/>
```

```tsx
const VideoConfController = ({ icon, active, secondary, disabled, small = true, ...props }: VideoConfControllerProps): ReactElement => {
	const id = useUniqueId();

	return (
		<IconButton
			small={small}
			icon={icon}
			id={id}
			info={active}
			disabled={disabled}
			secondary={secondary || active || disabled}
			{...props}
		/>
	);
};
```

### Avoid direct styles

Refrain from applying direct styles to components. By avoiding inline styling, the code maintains a cleaner structure and promotes better separation of concerns, enhancing maintainability and readability.

❌ Avoid:

```tsx
<VideoConfPopup>
	<VideoConfPopupHeader>
		<VideoConfPopupTitle text={t('Calling')} counter />
		<VideoConfPopupControllers>
			<Box display='flex' alignItems='center'>
				<VideoConfController
					width='50px'
					height='50px'
					active={controllersConfig.cam}
					title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
					icon={controllersConfig.cam ? 'video' : 'video-off'}
					disabled
				/>
				<VideoConfController
					active={controllersConfig.mic}
					title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
					icon={controllersConfig.mic ? 'mic' : 'mic-off'}
					disabled
				/>
			</Box>
		</VideoConfPopupControllers>
	</VideoConfPopupHeader>
</VideoConfPopup>
```

### Don't write CSS styles in JS files

This approach separates your component's logic from styling, promoting better code organization and maintainability while avoiding inline CSS-in-JS styling.

Define your custom styling in an external CSS file:

```css
/* styles.css */

.customClass {
	border: 1px solid black;
	padding: 1.5rem;
}
```

Then, apply the class to your component:

```tsx
import './styles.css';

return (
	<VideoConfPopup>
		<VideoConfPopupHeader>
			<VideoConfPopupTitle text={t('Calling')} counter />
			<VideoConfPopupControllers>
				<VideoConfController
					className='customClass'
					active={controllersConfig.cam}
					title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
					icon={controllersConfig.cam ? 'video' : 'video-off'}
					disabled
				/>
				<VideoConfController
					active={controllersConfig.mic}
					title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
					icon={controllersConfig.mic ? 'mic' : 'mic-off'}
					disabled
				/>
			</VideoConfPopupControllers>
		</VideoConfPopupHeader>
	</VideoConfPopup>
);
```

### Use the states of the component

By using component states to conditionally render different complex components, you maintain a clear and organized structure in your code, enhancing readability and maintainability.

```tsx
if (isReceiving) {
	return <IncomingPopup room={room} id={id} position={position} onClose={onClose} onMute={handleMute} onConfirm={handleConfirm} />;
}

if (isCalling) {
	return <OutgoingPopup room={room} id={id} onClose={onClose} />;
}

return <StartCallPopup loading={starting} room={room} id={id} onClose={dismissOutgoing} onConfirm={handleStartCall} />;
```

Each state should render the proper Complex Component:

```tsx
const OutgoingPopup = ({ room, onClose, id }: OutgoingPopupProps): ReactElement => {
	const t = useTranslation();
	const videoConfPreferences = useVideoConfPreferences();
	const { controllersConfig } = useVideoConfControllers();

	return (
		<VideoConfPopup>
			<VideoConfPopupHeader>
				<VideoConfPopupTitle text={t('Calling')} counter />
				<VideoConfPopupControllers>
					<VideoConfController
						active={controllersConfig.cam}
						title={controllersConfig.cam ? t('Cam_on') : t('Cam_off')}
						icon={controllersConfig.cam ? 'video' : 'video-off'}
						disabled
					/>
					<VideoConfController
						active={controllersConfig.mic}
						title={controllersConfig.mic ? t('Mic_on') : t('Mic_off')}
						icon={controllersConfig.mic ? 'mic' : 'mic-off'}
						disabled
					/>
				</VideoConfPopupControllers>
			</VideoConfPopupHeader>
		</VideoConfPopup>
	);
};
```

## Visual components

Visual components are responsible for the appearance of a UI element. They define the element's style, layout, and other visual properties.

Adhering to the guidelines in Fuselage's componentization offers the value of modular, reusable, and maintainable UI components. This approach enables efficient development, ensures consistent behavior, and supports the evolution of solutions from specific contexts to broader applications. By encapsulating logic, avoiding direct styles, and leveraging API-driven customization, developers can create a streamlined and user-centered experience.
