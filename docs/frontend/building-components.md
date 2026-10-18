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

Comprehensive unit tests ensure reliability across all intended scenarios. Query by role and name, and `await` every `userEvent` call (see [testing.md](testing.md)):

```jsx
describe('[Menu Component]', () => {
	it('should renders without crashing', () => {
		render(<Simple />);
	});

	it('should open options when click', async () => {
		render(<Simple />);
		await userEvent.click(screen.getByRole('button', { name: 'More options' }));
		expect(await screen.findByRole('menuitem', { name: 'Make Admin' })).toBeInTheDocument();
	});

	it('should have no options when click twice', async () => {
		render(<Simple />);
		const button = screen.getByRole('button', { name: 'More options' });
		await userEvent.click(button);
		await userEvent.click(button);
		expect(screen.queryByRole('menuitem', { name: 'Make Admin' })).not.toBeInTheDocument();
	});

	it('should have no options when click on menu and then elsewhere', async () => {
		render(<Simple />);
		await userEvent.click(screen.getByRole('button', { name: 'More options' }));
		await userEvent.click(document.body);
		expect(screen.queryByRole('menuitem', { name: 'Make Admin' })).not.toBeInTheDocument();
	});
});
```

`Simple` here is the story composed with `composeStories`, so it already carries its args.

### Avoid "Boxed" components

The `Box` component works as a wildcard primarily for simple or complex components during prototyping. For simple components specifically, construct using HTML tags instead.

## Complex components

Complex components combine multiple simple components for sophisticated UI elements like modals or tables.

### Visual only, no logic

Concentrate solely on the user interface design, ensuring it is poised to incorporate the required logic seamlessly.

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

Start with Storybook to separate interface from logic:

```tsx
export const CallingDM: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon variant='incoming' />
			<VideoConfMessageText>Calling...</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageAction primary>Join</VideoConfMessageAction>
			<VideoConfMessageFooterText>Waiting for answer</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);

export const CallEndedDM: ComponentStory<typeof VideoConfMessage> = () => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<VideoConfMessageIcon />
			<VideoConfMessageText>Call ended</VideoConfMessageText>
		</VideoConfMessageRow>
		<VideoConfMessageFooter>
			<VideoConfMessageAction>Call Back</VideoConfMessageAction>
			<VideoConfMessageFooterText>Call was not answered</VideoConfMessageFooterText>
		</VideoConfMessageFooter>
	</VideoConfMessage>
);
```

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
export type VideoConfMessageProps = {
	children: ReactNode;
};

const VideoConfMessage = ({ children }: VideoConfMessageProps) => (
	<Box mbs='x4' maxWidth='345px' borderWidth={2} borderColor='neutral-200' borderRadius='x4'>
		{children}
	</Box>
);
```

The component names the props it accepts rather than spreading `AllHTMLAttributes` onto the `Box` — see [react.md](react.md#destructure-props-explicitly-dont-spread-them).

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
const VideoConfController = ({ icon, title, active, secondary, disabled, small = true, onClick }: VideoConfControllerProps): ReactElement => {
	const id = useId();

	return (
		<IconButton
			small={small}
			icon={icon}
			title={title}
			id={id}
			info={active}
			disabled={disabled}
			secondary={secondary || active || disabled}
			onClick={onClick}
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

## Design tokens

The rules above ([Avoid hardcoded values](#avoid-hardcoded-values-or-magic-numbers),
[Avoid direct styles](#avoid-direct-styles)) apply to colors, type and spacing too:

- **Colors come from `Palette`** (exported by `@rocket.chat/fuselage`) or from Box color props — never hex or `rgba()`
  literals, which ignore the dark and high-contrast themes. See `packages/ui-voip/src/components/Cards/Card.tsx`.
- **Type comes from `fontScale`** (`<Box fontScale='p2' />`), not `fontSize` / `fontWeight` / `lineHeight`.
- **Sizes and spacing are multiples of 4**, expressed with Fuselage's size tokens (`'x4'`, `'x8'`, `'x16'`).
- **Use Fuselage props, not `style`.** `style={{ … }}` bypasses the tokens and the theme.
- **Use current Fuselage APIs.** Check the component's types before using a prop — deprecated ones are marked
  `@deprecated` there, and the editor strikes them through.

```tsx
// ❌
<Box style={{ color: '#6C727A', fontSize: 13, marginTop: 6 }}>{t('Waiting_for_answer')}</Box>

// ✅
<Box color='hint' fontScale='c1' mbs='x4'>
	{t('Waiting_for_answer')}
</Box>
```

## Every user-visible string is translated

Labels, titles, `aria-label`s, toasts and empty states all go through i18n — see [docs/i18n.md](../i18n.md) and
[the client-side guide](i18n.md).

## Packages and bundles

- **Feature code that doesn't need Meteor lives in its own package** (`packages/ui-*`), with its own stories and
  tests. `apps/meteor/client` wires it to the app.
- **Heavy SDKs load on demand.** Meteor's bundler does not tree-shake (see
  [bundle-optimization-react-aria.md](../bundle-optimization-react-aria.md)), so a static import puts the whole
  library in every bundle that reaches it. Load it behind `lazy()` or a dynamic `import()`, as
  `apps/meteor/client/views/omnichannel/chartHandler.ts` does with `await import('chart.js/auto')`.
- **Never import a heavy SDK statically from a shared path.** A preflight screen shared by every call provider
  imported `livekit-client` statically, which put that SDK in every provider's window, used or not. Keep the import
  inside the code path that needs it.
- **Don't commit binaries** (models, WASM, media). Serve them from the installed npm package; when they come from
  outside npm, download them at build time and pin them by checksum.
- **Build asset URLs against the root path prefix.** A literal `/assets/…` breaks deployments served under a
  sub-path. Use `useAbsoluteUrl()` from `@rocket.chat/ui-contexts` (or `getURL` in
  `apps/meteor/app/utils/lib/getURL.ts` outside React).

## Visual components

Visual components are responsible for the appearance of a UI element. They define the element's style, layout, and other visual properties.

Adhering to the guidelines in Fuselage's componentization offers the value of modular, reusable, and maintainable UI components. This approach enables efficient development, ensures consistent behavior, and supports the evolution of solutions from specific contexts to broader applications. By encapsulating logic, avoiding direct styles, and leveraging API-driven customization, developers can create a streamlined and user-centered experience.
