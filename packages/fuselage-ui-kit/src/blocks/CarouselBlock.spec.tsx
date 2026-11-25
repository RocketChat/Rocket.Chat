import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { modalParser, messageParser } from '../surfaces';

const carousel = {
	type: 'carousel',
	elements: [
		{ type: 'card', title: { type: 'plain_text', text: 'First' } },
		{ type: 'card', title: { type: 'plain_text', text: 'Second' } },
		{ type: 'bogus' },
	],
} as never;

const scrollBy = jest.fn();

beforeAll(() => {
	Element.prototype.scrollBy = scrollBy;
});

beforeEach(() => scrollBy.mockClear());

it('renders each card as a slide of a labelled carousel and skips what is not a card', () => {
	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	// Without a translation, the key is the accessible name.
	expect(screen.getByRole('group', { name: 'UIKit_Carousel' })).toHaveAttribute('aria-roledescription', 'carousel');
	expect(screen.getAllByRole('group', { name: 'UIKit_Carousel_slide' })).toHaveLength(2);
	expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument();
	expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument();
});

it('scrolls the row sideways with the previous and next buttons', async () => {
	// jsdom has no layout: give the row a width and more content than fits, as a browser would.
	const sizes = ['clientWidth', 'scrollWidth'] as const;
	const originals = sizes.map((key) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
	Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 300 });
	Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 900 });

	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	expect(screen.getByRole('button', { name: 'UIKit_Carousel_previous' })).toBeDisabled();

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Carousel_next' }));
	expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 240 }));

	sizes.forEach((key, index) => {
		const descriptor = originals[index];

		if (descriptor) {
			Object.defineProperty(HTMLElement.prototype, key, descriptor);
		} else {
			delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
		}
	});
});

const withRtl = (fn: () => Promise<void> | void) => async () => {
	const sizes = ['clientWidth', 'scrollWidth'] as const;
	const originals = sizes.map((key) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
	Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 300 });
	Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 900 });

	const originalGetComputedStyle = window.getComputedStyle;
	window.getComputedStyle = jest.fn((...args: Parameters<typeof window.getComputedStyle>) => {
		const style = originalGetComputedStyle(...args);
		return new Proxy(style, {
			get: (target, prop) => (prop === 'direction' ? 'rtl' : Reflect.get(target, prop)),
		});
	}) as typeof window.getComputedStyle;

	try {
		await fn();
	} finally {
		window.getComputedStyle = originalGetComputedStyle;
		sizes.forEach((key, index) => {
			const descriptor = originals[index];

			if (descriptor) {
				Object.defineProperty(HTMLElement.prototype, key, descriptor);
			} else {
				delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
			}
		});
	}
};

it(
	'scrolls in the opposite physical direction in RTL',
	withRtl(async () => {
		render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

		await userEvent.click(screen.getByRole('button', { name: 'UIKit_Carousel_next' }));
		expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -240 }));
	}),
);

it(
	'enables Previous and disables Next at the end in RTL',
	withRtl(async () => {
		Object.defineProperty(HTMLElement.prototype, 'scrollLeft', { configurable: true, value: -600 });

		render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

		expect(screen.getByRole('button', { name: 'UIKit_Carousel_previous' })).toBeEnabled();
		expect(screen.getByRole('button', { name: 'UIKit_Carousel_next' })).toBeDisabled();

		const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollLeft');
		if (descriptor) {
			delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollLeft;
		}
	}),
);

it('renders nothing in a modal, which does not accept carousels', () => {
	render(<MockedServerContext>{modalParser.render([carousel])}</MockedServerContext>);

	expect(screen.queryByRole('group', { name: 'UIKit_Carousel' })).not.toBeInTheDocument();
});
