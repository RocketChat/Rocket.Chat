# React

> Most of the recommendations here are based on Alex Kondov's [Tao of React](https://alexkondov.com/tao-of-react/).

## Prefer functional components

React initially introduced class components to leverage JavaScript class syntax for managing state and component lifecycles. However, class components have significant drawbacks:

- they tend to be verbose;
- they often involve a misuse of the inheritance mechanism through `extends` and `super`.

Hooks were introduced to provide an alternative approach to declaring state and effects. They maintain the core concept of the component's render function without the need for classes, streamlining the development process.

## Declare one component per file

While colocation is a commendable concept, it's not consistently followed for React components within a single file. The main reason is that we've noticed people misusing this approach before. It might start with something as straightforward as adding a basic modal component alongside a page component, but it can quickly lead to a confusing jumble of components that becomes difficult to manage.

## Name components

Failing to name a component is a common mistake that can lead to prolonged debugging efforts. It results in less informative error stacks and challenges while navigating components in React Dev Tools. There are two approaches to properly name a component:

1. By assigning the function straight to a binding. The arrow function is itself anonymous, but assigning it to a `const` makes JavaScript infer the name from the variable:

```jsx
const Foo = () => {
	return <div>Foo</div>;
};

console.log('The component name is:', Foo.name);
```

2. By setting the `displayName` property. Once a wrapper call sits between the binding and the function, there is nothing for inference to attach to — the arrow is an argument to `memo`, and `memo` returns an object rather than a function:

```jsx
const Foo = memo(() => {
	return <div>Foo</div>;
});

Foo.displayName = 'Foo'; // `Foo.name` is `undefined`

console.log('The component name is:', Foo.displayName);
```

## Use default export at the end of file

While named exports are often preferred, using default export enhances code readability, especially when dealing with Higher Order Components (HOCs) like `memo` and `forwardRef`, and it aligns neatly with code splitting using `lazy`.

```tsx
// Component.tsx
import { memo } from 'react';

type ComponentProps = {
	name: string;
};

// Anonymous arrow, but the const assignment infers the name "Component"
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

// Anonymous arrow in an argument position — no name is inferred
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

## Extract helper functions

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

## Do not refer to the `children` prop explicitly

Children should always be actual children, not passed in as a prop. Use the `eslint-plugin-react` rule [`react/no-children-prop`](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-children-prop.md) as reference.

❌ Incorrect:

```jsx
export const MyComponent = ({ children }) => <div children={children} />;
```

✅ Correct:

```jsx
export const MyComponent = ({ children }) => <div>{children}</div>;
```

## Declare props type explicitly

Each component named, for instance, `Component` must have an _exported_ type declaration for `ComponentProps`.

```tsx
export type MyComponentProps = {
	// ...
};

const MyComponent = (props: MyComponentProps) => /* ... */;

export default MyComponent;
```

## Use generic types when appropriate

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

## Avoid naming identifiers with their value type/kind

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
