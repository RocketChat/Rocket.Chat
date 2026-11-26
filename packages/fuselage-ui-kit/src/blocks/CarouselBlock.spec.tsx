import { MockedServerContext } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

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

afterEach(() => jest.restoreAllMocks());

// jsdom has no layout: give the row a width and more content than fits, as a browser would.
const layOutRow = () => {
	jest.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300);
	jest.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(900);
};

const setRtl = () => {
	const { getComputedStyle } = window;
	jest.spyOn(window, 'getComputedStyle').mockImplementation(
		(...args) =>
			new Proxy(getComputedStyle(...args), {
				get: (target, prop) => (prop === 'direction' ? 'rtl' : Reflect.get(target, prop)),
			}),
	);
};

it('renders each card as a slide of a labelled carousel and skips what is not a card', () => {
	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	// Without a translation, the key is the accessible name.
	expect(screen.getByRole('group', { name: 'UIKit_Carousel' })).toHaveAttribute('aria-roledescription', 'carousel');
	expect(screen.getAllByRole('group', { name: 'UIKit_Carousel_slide' })).toHaveLength(2);
	expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument();
	expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument();
});

it('scrolls the row sideways with the previous and next buttons', async () => {
	layOutRow();

	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	expect(screen.getByRole('button', { name: 'UIKit_Carousel_previous' })).toBeDisabled();

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Carousel_next' }));
	expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 240 }));
});

it('scrolls in the opposite physical direction in RTL', async () => {
	layOutRow();
	setRtl();

	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	await userEvent.click(screen.getByRole('button', { name: 'UIKit_Carousel_next' }));
	expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -240 }));
});

it('enables Previous and disables Next at the end in RTL', () => {
	layOutRow();
	setRtl();
	jest.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(-600);

	render(<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>);

	expect(screen.getByRole('button', { name: 'UIKit_Carousel_previous' })).toBeEnabled();
	expect(screen.getByRole('button', { name: 'UIKit_Carousel_next' })).toBeDisabled();
});

it('finds the edges again when a language change flips the direction', async () => {
	const i18n = i18next.createInstance().use(initReactI18next);
	await i18n.init({ lng: 'en' });
	layOutRow();
	const scrollLeft = jest.spyOn(Element.prototype, 'scrollLeft', 'get').mockReturnValue(600);

	render(
		<I18nextProvider i18n={i18n}>
			<MockedServerContext>{messageParser.render([carousel])}</MockedServerContext>
		</I18nextProvider>,
	);

	expect(screen.getByRole('button', { name: 'UIKit_Carousel_next' })).toBeDisabled();

	// The flip leaves the row at the start of the RTL axis without a scroll event to report it.
	setRtl();
	scrollLeft.mockReturnValue(0);
	await act(() => i18n.changeLanguage('ar'));

	expect(screen.getByRole('button', { name: 'UIKit_Carousel_previous' })).toBeDisabled();
	expect(screen.getByRole('button', { name: 'UIKit_Carousel_next' })).toBeEnabled();
});

it('renders nothing in a modal, which does not accept carousels', () => {
	render(<MockedServerContext>{modalParser.render([carousel])}</MockedServerContext>);

	expect(screen.queryByRole('group', { name: 'UIKit_Carousel' })).not.toBeInTheDocument();
});
