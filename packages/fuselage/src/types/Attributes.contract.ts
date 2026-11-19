import type { AriaAttributes, AriaRole, Ref } from 'react';

// The groups a component's `<Component>.contract.ts` is built from. They name no DOM type, so the web and the React
// Native renderer of a component take the same contract; what only the web takes is in `WebAttributes.ts`.

/** How a test finds a part. */
export type TestAttributes = {
	testID?: string;
};

/** What a `ref` to a part can do on every platform. */
export type Handle = {
	focus(): void;
	blur(): void;
};

/** What any part takes besides its own variations and `children`. */
export type CommonAttributes = TestAttributes & {
	ref?: Ref<Handle>;
};

/** The role and the ARIA states of the button and link roles. */
export type ActionAccessibilityAttributes = {
	role?: AriaRole;
} & Pick<
	AriaAttributes,
	| 'aria-label'
	| 'aria-labelledby'
	| 'aria-describedby'
	| 'aria-controls'
	| 'aria-current'
	| 'aria-disabled'
	| 'aria-expanded'
	| 'aria-haspopup'
	| 'aria-hidden'
	| 'aria-live'
	| 'aria-pressed'
	| 'aria-selected'
>;

/** A click, a tap or the keyboard activation of a part. */
export type PressEvents = {
	onPress?: () => void;
};

/** Declared only by a part whose renderers detect a long press. */
export type LongPressEvents = {
	onLongPress?: () => void;
};

/** The new value of a part that holds one, not the event that produced it. */
export type ChangeEvents<TValue> = {
	onChange?: (value: TValue) => void;
};

/** The contract of a part that acts when pressed: a button, a link, a dismissable chip. */
export type ActionContract = CommonAttributes & ActionAccessibilityAttributes & PressEvents;

/** The ARIA states of a part that holds a checked state. */
export type SelectionAccessibilityAttributes = Pick<
	AriaAttributes,
	'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'aria-required' | 'aria-hidden'
>;

/** The contract of a part that holds a checked state: a check box, a radio button, a switch. */
export type SelectionContract = CommonAttributes &
	SelectionAccessibilityAttributes & {
		checked?: boolean;
		defaultChecked?: boolean;
		disabled?: boolean;
	};
