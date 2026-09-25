import { useOutsideClick, useToggle } from '@rocket.chat/fuselage-hooks';
import type { RefCallback, RefObject } from 'react';
import { useCallback, useMemo, useRef } from 'react';

/**
 * A ref that can be attached as a callback and still be read as an object.
 *
 * Both are needed at once here: React calls it when the node attaches, which is what lets this hook own the ref
 * rather than ask for one — while `useOutsideClick` and Fuselage's `Dropdown` both take a `RefObject` and read
 * `.current`. A single value satisfying both is what keeps the call sites unchanged.
 */
export type ElementRef<T> = RefCallback<T> & RefObject<T | null>;

const createElementRef = <T>(): ElementRef<T> => {
	const ref = ((node: T | null) => {
		ref.current = node;
	}) as ElementRef<T>;

	ref.current = null;

	return ref;
};

/**
 * Whether a dropdown attached to a control is open, and how to say otherwise.
 *
 * A click anywhere else closes it — but not a click on the control it hangs from, which has its own answer to
 * being clicked and would otherwise close and reopen it in one gesture.
 *
 * The refs are this hook's own, handed back for attaching. Every caller used to declare the same two `useRef`s
 * and pass them in, which made the pairing of *which* ref goes where the caller's problem to get right.
 */
export const useDropdownVisibility = <Reference extends HTMLElement = HTMLElement, Target extends HTMLElement = HTMLElement>(): {
	isVisible: boolean;
	toggle: (state?: boolean) => void;
	/** Goes on the control the dropdown hangs from. */
	reference: ElementRef<Reference>;
	/** Goes on the dropdown itself. */
	target: ElementRef<Target>;
} => {
	const [isVisible, toggle] = useToggle(false);

	const refs = useRef<{ reference: ElementRef<Reference>; target: ElementRef<Target> }>(undefined as never);

	if (!refs.current) {
		refs.current = { reference: createElementRef<Reference>(), target: createElementRef<Target>() };
	}

	const { reference, target } = refs.current;

	useOutsideClick(
		// Widened deliberately: `RefObject` is invariant in its element type, so a pair typed for a button and a
		// div does not unify on its own — and what this call needs of them is only `.current`, which every element
		// has.
		useMemo(() => [target, reference] as RefObject<HTMLElement | null>[], [target, reference]),
		useCallback(() => toggle(false), [toggle]),
	);

	return {
		isVisible,
		toggle,
		reference,
		target,
	};
};
