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

## A provider reads, a component is told

> Scale this to the change. A three-prop dropdown needs no context of its own — passing
> the value in is the whole of it. What follows matters for a screen, or for a set of
> components that share a situation.

The line is the provider, not the package. `useSetting` in a package's provider is fine;
the same call in one of its components is not.

The reason is dependencies. Every context a component reads is one more thing standing
between it and being rendered: a story has to mock it, a test has to stand it up, and
moving the component means carrying that context along. A provider pays that cost once,
for a whole screen.

`packages/ui-voip` is the precedent — its providers reach endpoints, streams and
settings, and nothing under its `components/` reads an application context at all.

### Settings, permissions and the viewer

`useSetting`, `usePermission`, `useUserId`, `useUser`, `useUserPreference`.

❌

```tsx
const CallMemberItem = ({ member }: CallMemberItemProps) => {
	const canRing = usePermission('videoconf-ring-users');
	const useRealName = useSetting('UI_Use_Real_Name', false);
```

✅ — a prop when one component needs it; one group on the provider when a screenful do:

```ts
export type ConferenceViewer = {
	useRealName: boolean;
	displayAvatars: boolean;
	canRingUsers: boolean;
};
```

Asked once, where the screen is assembled. A story then states the workspace instead of
mocking one.

Every field there is already an answer. Note what is *not* in it: the viewer's id. See
below.

### Where it is mounted

Routes and the surrounding screen are circumstances the provider recognises.

❌

```tsx
const joinDisabled = useCurrentRoutePath()?.startsWith('/conference/');
```

✅

```tsx
const joinDisabled = useContext(VideoConfContext)?.joinDisabled ?? false;
```

The provider knows the circumstance; the block only knows how to dim a button. Deciding
it in the block means the block has to know what a call window's address looks like.

### Hand over the answer, not the material

Two shapes of one mistake: giving a component a collection to search, or an identity to
derive from. Both leave the deriving in the component, which is where it will be written
again by the next component that needs it.

**A collection to search.** If a row needs one fact about its own item, give it that fact.

❌

```tsx
const { silencedCalls } = useOngoingCalls();
const incoming = useVideoConfIncomingCalls();
const silenced = silencedCalls.includes(call.callId);
const audible = incoming.some(({ callId, dismissed }) => callId === call.callId && !dismissed);
```

✅

```tsx
const { audible, silenced, silence } = callRing(call.callId);
```

Handing over the collection couples the row to how the set is stored, and here it dragged
in a second context to search alongside the first.

**An identity to derive from.** Passing the viewer's id is the same move: raw material
plus a rule the component now has to carry.

❌

```tsx
const { uid } = useConferenceViewer();
const present = access.members.filter(isInVideoConference);

if (!present.length || !hasConferenceChatAccess(access, uid)) {
	return null;
}
```

✅

```tsx
const { present, canShare } = access;

if (!present.length || !canShare) {
	return null;
}
```

If who the viewer *is* genuinely matters — the component shows their name, or keys
storage by them — then pass the id and say so in its name. Otherwise the provider should
answer the question the id was going to be used to ask, and expose the actions and the
derived facts rather than the identity behind them.

### A rule is a function, not an effect

❌ — what a room may be, decided across four effects that each fire on their own
dependency and write back into form state:

```tsx
useEffect(() => {
	if (federated) {
		setValue('encrypted', false);
		setValue('broadcast', false);
		setValue('readOnly', false);
	}
}, [federated, setValue]);

useEffect(() => {
	if (!isPrivate) {
		setValue('encrypted', false);
	}
}, [isPrivate, setValue]);
```

✅ — one function that answers both questions the screen has:

```ts
const { room, editable } = resolveRoomCreation(draft, policy);
```

An effect that only reads state and writes state is a derivation in an effect's clothes.
It cannot be tested without rendering the component, it is invisible as a rule because it
is spread across several dependency arrays, and the next screen that needs the same rule
writes it again — differently. Effects are for reaching outside React.

What remains after hoisting is still an effect, and that is fine: writing the answer into
a form library's store *is* reaching outside React. Keep it, and keep it branchless. The
deciding already happened.

**Check the transition before you delete it.** A rule that clears a field is not always a
mask. Making a room public does not hide the encryption choice, it drops it — turn the
room private again and the toggle is off, not restored. Rewriting that as a pure "derive
the effective value" loses a decision someone made on purpose. The tests pinning it are
the ones to run first.

### A component reports, it does not route

❌

```tsx
await forwardChat(payload);
dispatchToastMessage({ type: 'success', message: t('Transferred') });
router.navigate('/home');
```

✅

```tsx
await onForward({ department, username, comment });
onCancel();
```

A modal for handing a chat to someone else should not know the workspace's home address.
It calls the action it was given and says what happened; what that means for the screen
around it — where to go, what to close, what to announce — belongs to the caller, the
only place that knows.

The toast is the same decision in smaller print: a component that dispatches its own
success message has decided, on behalf of every caller it will ever have, that succeeding
is worth announcing.

`useQuickActions` already hands `TranscriptModal` its `onRequest`, `onSend` and
`onDiscard`. A screen whose actions arrive as values is one a story can drive with spies
and a spec can assert without a server.

### The question that settles it

Can this component be rendered from a plain object — no workspace, no router, no server?
If not, whatever stands in the way belongs on the provider.

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
[A provider reads, a component is told](#a-provider-reads-a-component-is-told).

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

Start by inventing the shape the screen needs, and build against it. Not the endpoint's
shape — the screen's. None of it has to exist yet.

```ts
type ConferenceCall = {
	members: ConferenceMember[];
	canRing: boolean;
	ended: boolean;
	name: string;
	capabilities: VideoConferenceCapabilities;
};
```

Every story then **states a situation** rather than arranging one:

```tsx
withLiveConference({
	call: { members, name: 'Weekly sync', createdAt, capabilities },
	room: { rid: 'room-id', name: 'general', type: 'c', loading: false },
	session: { joined: true, url: 'about:blank' },
});
```

That story used to seed a query client with a join result and mock six endpoints to reach
the same frame. The gain is not convenience: a story that mocks transport documents the
transport, and breaks when the transport changes.

**Actions are values too.** `join`, `leave`, `ringMember` and `shareChat` arrive as
functions the screen calls — a story logs them, a spec asserts a spy. `ChatAccessModal`
asserted `shareChat({ callId, mode })` against a mocked endpoint; it now asserts
`shareChat(mode)` against a spy, and the modal has no idea a server exists.

**What cannot be built this way, take as a slot.** Some parts are genuinely the product's:
a whole room with its composer, a live presence store, an autocomplete that has to read
the room. Those arrive as nodes or render props rather than being reimplemented.

```ts
type ConferenceSlots = {
	chat?: ReactNode;
	renderMemberStatus?: (uid: string) => ReactNode;
	renderUserPicker?: (props: UserPickerProps) => ReactNode;
};
```

**Wiring is a separate step**, and can be a separate pull request: the screens land with
their stories and no way to reach them, then a second change supplies the reads, the
actions and the routes. The first carries no risk by construction; the second is where
the risk is, and it is small enough to read.

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
