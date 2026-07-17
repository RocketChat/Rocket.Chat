# Frontend Guidelines

> Compiled from the internal Confluence page [Guidelines](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/753532947/Guidelines) (R&D space) and its child pages. These are the guidelines for writing clear, concise, and consistent frontend code.

## Table of contents

- [TypeScript general conventions](#typescript-general-conventions)
- [Migrating from JavaScript](#migrating-from-javascript)
- [React](#react)
- [Building components](#building-components)

---

## TypeScript general conventions

### Don't use CommonJS features

Avoid using CommonJS features such as `require` and `module` alongside ES module constructs like `import` and `export`. The preference is for ES modules due to their enhanced portability and user-friendly nature. However, keep in mind that synchronous conditional imports aren't possible in ES modules.

Example of CommonJS (not recommended):

```ts
// commonjs.ts
if (condition) {
	const foo = require('foo');
	module.exports = foo;
} else {
	module.exports = {};
}
```

Invalid ES module pattern:

```ts
// esmodule.ts
if (condition) {
	import foo from 'foo';
	export default foo;
} else {
	export default {};
}
```

### Prefer `import type` over `import`

Prioritize using `import type` for type-only imports. While a regular `import` works for both JavaScript and TypeScript, it can include module output code in the bundle. The `import type` construct is specific to TypeScript compilation and avoids unnecessary code inclusion.

```ts
// Foo.ts
export class Foo {
	bar: string;

	constructor(bar: string) {
		this.bar = bar;
	}
}

// Bar.ts
export class Bar {
	foo: Foo;

	constructor(foo: Foo) {
		this.foo = foo;
	}
}

// index.ts
import { Foo } from './Foo';
import type { Bar } from './Bar';

declare const foo: Foo;
declare const bar: Bar;

// index.js (transpiled from index.ts)
import { Foo } from './Foo';
```

### Know the difference between `type` and `interface`

An `interface` serves as a type declaration similar to a class construct, while a `class` functions as an actual class declaration.

```ts
interface IThing {
	prop: string;
	method(): void;
}

class Thing implements IThing {
	public prop = 'foo';

	method(): void {
		console.log('bar');
	}
}
```

A `type` construct is similar to an interface but offers greater flexibility. The `type` construct permits declaration of union types:

```ts
type Foo = string | number;
```

An `interface` can declare generic types:

```ts
interface IFoo<T> {
	prop: T;
}
```

A `type` also supports generics and conditional types, providing more adaptability:

```ts
type Foo<T> = T extends string ? { foo: number } : { bar: number };
```

### Avoid using classes as namespaces

Pattern to avoid:

```ts
// foo.ts
class Foo {
	bar(): void {
		// ...
	}
}

export const foo = new Foo();

// index.ts
import { foo } from './foo';

foo.bar();
```

Preferred approach (when no state is needed):

```ts
// foo.ts
export function bar(): void {
	// ...
}

// index.ts
import * as foo from './foo';

foo.bar();
```

Valid use case (when managing state):

```ts
// foo.ts
class Foo {
	baz: number;

	bar(): void {
		// perform actions referencing and modifying `this.baz`
	}
}

export const foo = new Foo();

// index.ts
import { foo } from './foo';

foo.bar();
```

Classes are reasonable when they encapsulate state and provide a controlled interface for modification.

### Avoid using the `any` type except when it's used as a constraint

Refrain from using `any` under most circumstances. Instead, follow this model:

- `unknown` serves as the universal type, encompassing all potential values;
- `any` should not be seen as an actual type, but rather as a means to disable TypeScript's type checking.

Using `any` is discouraged as it indicates unawareness regarding the type being manipulated. Working with `unknown` necessitates type narrowing, leading to more robust code.

```ts
// Avoid using any
declare const foo: any;
foo.bar(); // No compilation error

// Prefer using unknown
declare const bar: unknown;
bar.baz(); // Compilation error

const hasBaz = (bar: unknown): bar is { baz(): void } =>
	typeof bar === 'object' && bar !== null && 'baz' in bar && typeof (bar as { baz: unknown }).baz === 'function';

if (hasBaz(bar)) {
	bar.baz(); // No compilation error
}
```

Exception — generic type constraints:

```ts
type X<F> = F extends (x: unknown) => void ? true : false;
type Y<F> = F extends (x: any) => void ? true : false;

type A = X<(x: string) => void>; // `false`, because x is not `unknown`
type B = Y<(x: string) => void>; // `true`, because x is anything
```

---

## Migrating from JavaScript

### TypeScript is a superset of JavaScript

TypeScript is an extension of JavaScript, meaning that when transitioning from JavaScript to TypeScript, you can employ the identical syntax used in JavaScript. Many errors flagged by the TypeScript compiler (`tsc`) and ESLint enforce best practices, though some can be disregarded if they don't affect functionality.

### JSDoc

When `allowJs` is enabled in `tsconfig.json`, JSDoc comments can document types within JavaScript code. This is particularly useful during gradual migration when `tsc` struggles with type inference.

Example with `@typedef`:

```js
// module.js

/**
 * @typedef {Object} Foo
 * @property {string} bar
 * @property {string} qux
 */

export const foo = { bar: 'baz' };

foo.qux = 'quux';
```

Alternative using the `@type` tag:

```js
// module.js

/**
 * @type {{ bar: string; qux: string }}
 */
export const foo = { bar: 'baz' };

foo.qux = 'quux';
```

Both approaches help ensure TypeScript accurately recognizes the complete type structure.

### Declare a `*.d.ts` file

Creating a `.d.ts` declaration file is strongly recommended when migrating large JavaScript modules. These files manage imports and exports, functioning as a module's interface. This approach is superior to JSDoc for planning and understanding module structure.

```ts
// hugeModule.d.ts
export function foo(): void; // maybe it will be placed in another module
export function bar(): void; // maybe it will be placed in another module
```

---

## React

> Most of the recommendations here are based on Alex Kondov's [Tao of React](https://alexkondov.com/tao-of-react/).

### Prefer functional components

React initially introduced class components to leverage JavaScript class syntax for managing state and component lifecycles. However, class components have significant drawbacks:

- they tend to be verbose;
- they often involve a misuse of the inheritance mechanism through `extends` and `super`.

Hooks were introduced to provide an alternative approach to declaring state and effects. They maintain the core concept of the component's render function without the need for classes, streamlining the development process.

### Declare one component per file

While colocation is a commendable concept, it's not consistently followed for React components within a single file. The main reason is that we've noticed people misusing this approach before. It might start with something as straightforward as adding a basic modal component alongside a page component, but it can quickly lead to a confusing jumble of components that becomes difficult to manage.

### Name components

Failing to name a component is a common mistake that can lead to prolonged debugging efforts. It results in less informative error stacks and challenges while navigating components in React Dev Tools. There are two approaches to properly name a component:

1. By writing a non-anonymous function:

```jsx
const Foo = () => {
	return <div>Foo</div>;
};

console.log('The component name is:', Foo.name);
```

2. By using the `displayName` property:

```jsx
const Foo = memo(() => {
	return <div>Foo</div>;
});

Foo.displayName = 'Foo'; // `Foo.name` is `undefined`

console.log('The component name is:', Foo.displayName);
```

### Use default export at the end of file

While named exports are often preferred, using default export enhances code readability, especially when dealing with Higher Order Components (HOCs) like `memo` and `forwardRef`, and it aligns neatly with code splitting using `lazy`.

```tsx
// Component.tsx
import { memo } from 'react';

type ComponentProps = {
	name: string;
};

// It is NOT an anonymous function
const Component = (props: ComponentProps) => {
	return <div>Hello, {props.name}</div>;
};

export default memo(Component); // the component name is preserved
```

```ts
// index.ts
import { lazy } from 'react';

const Component = lazy(() => import('./Component'));
```

The same example based on named exports is less readable:

```tsx
// Component.tsx
import { memo } from 'react';

type ComponentProps = {
	name: string;
};

// It is an anonymous function
export const Component = memo((props: ComponentProps) => {
	return <div>Hello, {props.name}</div>;
});

Component.displayName = 'Component'; // needed for React Dev Tools
```

```ts
// index.ts
import { lazy } from 'react';

const Component = lazy(async () => {
	const { Component } = await import('./Component');
	return { default: Component }; // you need to reconstruct the default export
});
```

### Extract helper functions

A drawback associated with the adoption of React Hooks is the tendency for individuals to define helper functions within the component. This is facilitated by the fact that there is no requirement to pass arguments; instead, variables from the encompassing scope can be directly accessed and used.

```jsx
const Component = () => {
	const value = useMyHook();
	const isValueOK = () => value === 'OK';
	return isValueOK() ? <>OK</> : null;
};
```

Typically, effective helper functions adhere to the principle of being pure, which makes them simpler to debug. However, when you bind variables into the helper's scope, you're making it impure. Furthermore, with each rendering cycle, the function value gets redefined. While this process is efficient in terms of CPU and memory usage, it can lead to scenarios where you must rely on techniques like `useCallback` to prevent unnecessary re-renders of child components that receive your helper function as a prop.

Here's the ideal case:

```jsx
const isValueOK = (value) => value === 'OK';

const Component = () => {
	const value = useMyHook();
	return isValueOK(value) ? <>OK</> : null;
};
```

### Do not refer to the `children` prop explicitly

Children should always be actual children, not passed in as a prop. Use the `eslint-plugin-react` rule [`react/no-children-prop`](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-children-prop.md) as reference.

❌ Incorrect:

```jsx
export const MyComponent = () => <div children={...} />;
```

✅ Correct:

```jsx
export const MyComponent = () => <div>{...}</div>;
```

### Declare props type explicitly

Each component named, for instance, `Component` must have an _exported_ type declaration for `ComponentProps`.

```tsx
export type MyComponentProps = {
	// ...
};

const MyComponent = (props: MyComponentProps) => /* ... */;

export default MyComponent;
```

### Use generic types when appropriate

Generic types are a great way to ensure type safety once they enable us to not fall into the unsoundness of type assertions.

❌ Incorrect:

```tsx
// MyComponent.tsx
export type MyComponentProps = {
	value: unknown;
	onChange: (newValue: unknown) => void;
};

const MyComponent = ({ value, onChange }: MyComponentProps) => /* ... */;

export default MyComponent;

// MyApp.tsx
import MyComponent from './MyComponent';

const MyApp = () => {
	const [value, setValue] = useState('');
	const handleChange = (value: unknown) => {
		setValue(value as string); // unsound type assertion, as unknown can be anything
	};
	return <MyComponent value={value} onChange={handleChange} />;
};

export default MyApp;
```

✅ Correct:

```tsx
// MyComponent.tsx
export type MyComponentProps<TValue> = {
	value: TValue;
	onChange: (newValue: TValue) => void;
};

const MyComponent = <TValue,>({ value, onChange }: MyComponentProps<TValue>) => /* ... */;

export default MyComponent;

// MyApp.tsx
import MyComponent from './MyComponent';

const MyApp = () => {
	const [value, setValue] = useState('');
	const handleChange = (value: string) => {
		setValue(value);
	};
	// since `value` is string, `onChange` type will be inferred
	// as `(value: string) => void`
	return <MyComponent value={value} onChange={handleChange} />;
};

export default MyApp;
```

### Avoid naming identifiers with their value type/kind

This is a common programming convention, but it seems easier to violate when working with React concepts. In general, identifiers should not include information about the data structure they refer to.

```ts
// Examples of bad identifiers
const amountConst = 123; // instead of "amount"
let countNumber = 0; // instead of "count"
function logFunction(lineString: string) {
	// instead of "log" and "line"
	console.log(lineString);
}
```

Identifiers like this mimic the old-fashioned Hungarian notation. In React, this happens quite often:

```tsx
// Examples of bad identifiers in React constructs
function useThingHook() {
	// ...
} // instead of "useThing"

const useThingContext = () => useContext(ThingContext);
// "ThingContext" already exposes itself as a context that provides a "Thing".
// "useThing" is good enough, since it doesn't need to expose its context dependency.

const MyComponent = () => <div />;
// Fine for code examples and components passed by props*, but in general
// capital cased function names used in JSX already communicate they are of
// "Component" kind

// * when "Component" is okay as a suffix
type MyPanelProps = {
	panelComponent: ElementType<{}>;
};

function MyPanel({ panelComponent: PanelComponent }: MyPanelProps) {
	// "PanelComponent" is fine here
	return (
		<div className='panel'>
			<PanelComponent />
		</div>
	);
}
```

---

## Building components

A component is a reusable piece of code that represents a single UI element. Components vary by complexity and type, existing at either the **application** level or the **Fuselage library** level:

- **Application components** remain specific to particular Rocket.Chat applications, without cross-application reusability.
- **Fuselage library components** are reusable across all Rocket.Chat applications and represent the recommended approach.

### Component rules matrix

| Combination      | Fuselage level | Application level |
| ---------------- | -------------- | ----------------- |
| Simple & Visual  | ✅             | ❌                |
| Complex & Visual | ✅             | ✅                |
| Simple & Logical | ❌             | ❌                |
| Complex & Logical| ❌             | ✅                |

### Simple components

Simple components represent atomic UI elements like buttons or text fields.

#### Prefer variation over styles

Use prop names suggesting component variation rather than style-based props. Instead of `color="blue"`, use `variation="primary"` for improved readability and consistency.

#### Avoid hardcoded values or magic numbers

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

#### Customize via CSS variables

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

#### Document variations in Storybook

Display all possible variations with descriptive explanations for non-obvious options.

#### Unit test all behaviors

Comprehensive unit tests ensure reliability across all intended scenarios:

```jsx
describe('[Menu Component]', () => {
	const menuOption = screen.queryByText('Make Admin');

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
		userEvent.click(button);
		userEvent.click(button);
		expect(menuOption).toBeNull();
	});

	it('should have no options when click on menu and then elsewhere', async () => {
		const { getByTestId } = render(<Simple {...Simple.args} />);
		const button = getByTestId('menu');
		userEvent.click(button);
		userEvent.click(document.body);
		expect(menuOption).toBeNull();
	});
});
```

#### Avoid "Boxed" components

The `Box` component works as a wildcard primarily for simple or complex components during prototyping. For simple components specifically, construct using HTML tags instead.

### Complex components

Complex components combine multiple simple components for sophisticated UI elements like modals or tables.

#### Visual only, no logic

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

#### Split components for clarity

Structure components into understandable, logical segments.

#### Develop with Storybook first

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

#### Child components must remain scoped

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

#### Encapsulate HTML elements, Box, and Box props

Encapsulation ensures predictable behavior and streamlined debugging by accessing HTML elements and Box props solely through the Box component's API.

❌ Incorrect:

```tsx
export const VideoConfMessage: ComponentStory<typeof VideoConfMessage> = () => (
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
const VideoConfMessage = ({ ...props }): ReactElement => (
	<Box mbs='x4' maxWidth='345' borderWidth={2} borderColor='neutral-200' borderRadius='x4' {...props} />
);
```

#### Provide hooks as helpers

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

### Understanding the component and defining the scope

New components typically emerge from requirements put forth by the Product Design Team. The frontend engineer holds the responsibility of assessing the genuine necessity of such components. Due to the substantial effort involved in creating a new component, it is prudent to collaborate with product managers and designers. It is advisable to explore the feasibility of employing Complex Components as an MVP to validate concepts and user flows. Subsequent to successful validation, the progression to developing a new Fuselage level component can be considered.

**How do I know my component should be part of the Fuselage library?**

Consider the `VerticalBar` component as a clear example. It began as a Complex Component for a single application but has now advanced to the Fuselage level. This shift is driven by its usefulness in multiple applications, like Rocket.Chat and Cloud Portal. This case demonstrates how components can grow from specific solutions to versatile tools with broader applications.

### Logical components

#### Use child components to compose a logical complex component

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

#### Customization through variations

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

#### Avoid direct styles

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

#### Don't write CSS styles in JS files

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

#### Use the states of the component

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

### Visual components

Visual components are responsible for the appearance of a UI element. They define the element's style, layout, and other visual properties.

Adhering to the guidelines in Fuselage's componentization offers the value of modular, reusable, and maintainable UI components. This approach enables efficient development, ensures consistent behavior, and supports the evolution of solutions from specific contexts to broader applications. By encapsulating logic, avoiding direct styles, and leveraging API-driven customization, developers can create a streamlined and user-centered experience.
