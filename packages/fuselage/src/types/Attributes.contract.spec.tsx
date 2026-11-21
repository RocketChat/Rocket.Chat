import type { MouseEvent } from 'react';

import type { ActionContract, ChangeEvents, CommonAttributes, Handle, LongPressEvents } from './Attributes.contract';
import type { WebLinkAttributes, WebPressAlias, WebProps, WebTagAttributes } from './WebAttributes';

// What a component declares: the contract every renderer takes, and the props its web renderer takes.
type ButtonContract = ActionContract & LongPressEvents & { variant?: 'primary' | 'danger' };
type ButtonElement = HTMLButtonElement | HTMLAnchorElement;
type ButtonProps = WebProps<ButtonContract, ButtonElement> &
	WebPressAlias<ButtonElement> &
	WebLinkAttributes &
	WebTagAttributes<'button' | 'a'>;

type ToggleContract = CommonAttributes & ChangeEvents<boolean>;

// The assertions are the types: `yarn typecheck` fails on a broken one, and on a `@ts-expect-error` that stops erroring.
type Assignable<TTarget, TSource extends TTarget> = TSource;

describe('the neutral contract', () => {
	it('is what the web props are assignable to, so shared code typed against it takes a web component', () => {
		type WebToContract = Assignable<ButtonContract, ButtonProps>;
		const props: WebToContract = { 'variant': 'primary', 'aria-label': 'Save', 'testID': 'save', 'onPress': () => undefined };
		const contract: ButtonContract = props;

		expect(contract.testID).toBe('save');
	});

	it('takes the role, the declared ARIA states, testID, ref and the semantic events', () => {
		const contract = {
			'role': 'link',
			'aria-expanded': true,
			'aria-pressed': 'mixed',
			'testID': 'action',
			'ref': { current: null },
			'onPress': () => undefined,
			'onLongPress': () => undefined,
		} satisfies ButtonContract;

		expect(Object.keys(contract)).toHaveLength(7);
	});

	it('takes no DOM handler, DOM event or web attribute', () => {
		// @ts-expect-error `onClick` exists only on the web props
		const withClick: ButtonContract = { onClick: () => undefined };
		// @ts-expect-error a press carries no event
		const withEvent: ButtonContract = { onPress: (event: MouseEvent) => event.preventDefault() };
		// @ts-expect-error `id` is a web attribute
		const withId: ButtonContract = { id: 'save' };
		// @ts-expect-error `className` is a web attribute
		const withClassName: ButtonContract = { className: 'mine' };
		// @ts-expect-error `data-*` is a web attribute
		const withData: ButtonContract = { 'data-qa': 'save' };
		// @ts-expect-error only the declared ARIA subset
		const withUndeclaredAria: ButtonContract = { 'aria-colcount': 2 };

		expect([withClick, withEvent, withId, withClassName, withData, withUndeclaredAria]).toHaveLength(6);
	});

	it('hands a change the value, not the event', () => {
		const values: boolean[] = [];
		const contract: ToggleContract = { onChange: (value) => values.push(value) };
		// @ts-expect-error the value is typed by the part
		const wrongValue: ToggleContract = { onChange: (value: string) => value.trim() };

		contract.onChange?.(true);

		expect(values).toEqual([true]);
		expect(wrongValue.onChange).toBeDefined();
	});

	it('has a ref handle a DOM element satisfies', () => {
		const handle: Handle = document.createElement('button');

		expect(typeof handle.focus).toBe('function');
	});
});

describe('the web props', () => {
	it('add id, data-*, className, the link address, the closed tag set and the deprecated onClick', () => {
		const props = {
			'id': 'save',
			'className': 'mine',
			'data-qa': 'save',
			'href': '/home',
			'rel': 'noopener',
			'is': 'a',
			'onClick': (event) => event.preventDefault(),
		} satisfies ButtonProps;

		expect(props.is).toBe('a');
	});

	it('point the ref at the element', () => {
		const ref = { current: null as HTMLButtonElement | null };
		const props: ButtonProps = { ref };

		expect(props.ref).toBe(ref);
	});

	it('take no style and no tag outside the set', () => {
		// @ts-expect-error a frame cannot take a consumer style
		const withStyle: ButtonProps = { style: { color: 'red' } };
		// @ts-expect-error `div` is not one of the tags the part renders as
		const withTag: ButtonProps = { is: 'div' };

		expect([withStyle, withTag]).toHaveLength(2);
	});
});
