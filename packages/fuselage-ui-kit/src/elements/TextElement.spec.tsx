import type { TextObject } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import * as i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import MarkdownTextElement from './MarkdownTextElement';
import PlainTextElement from './PlainTextElement';
import { AppIdProvider } from '../contexts/AppIdContext';

let i18n: i18next.i18n;

beforeEach(async () => {
	i18n = i18next.createInstance().use(initReactI18next);

	await i18n.init({
		lng: 'en',
		resources: {
			en: {
				'app-test': {
					greeting: 'Hello, {{name}}',
					items_one: '{{count}} item',
					items_other: '{{count}} items',
					actor: 'Actor',
					actor_female: 'Actress',
				},
			},
		},
	});
});

const renderElement = (Element: typeof PlainTextElement | typeof MarkdownTextElement, textObject: TextObject) =>
	render(<Element textObject={textObject} />, {
		wrapper: ({ children }) => (
			<I18nextProvider i18n={i18n}>
				<AppIdProvider appId='test'>{children}</AppIdProvider>
			</I18nextProvider>
		),
	});

describe.each([
	['plain_text', PlainTextElement],
	['mrkdwn', MarkdownTextElement],
] as const)('%s', (type, Element) => {
	it('should interpolate args', async () => {
		renderElement(Element, { type, text: 'fallback', i18n: { key: 'greeting', args: { name: 'Ana' } } });

		expect(await screen.findByText('Hello, Ana')).toBeInTheDocument();
	});

	it('should select the plural form from `count`', async () => {
		renderElement(Element, { type, text: 'fallback', i18n: { key: 'items', args: { count: 2 } } });

		expect(await screen.findByText('2 items')).toBeInTheDocument();
	});

	it('should select the contextual form from `context`', async () => {
		renderElement(Element, { type, text: 'fallback', i18n: { key: 'actor', args: { context: 'female' } } });

		expect(await screen.findByText('Actress')).toBeInTheDocument();
	});

	it('should fall back to `text` when the key is missing', async () => {
		renderElement(Element, { type, text: 'fallback', i18n: { key: 'missing' } });

		expect(await screen.findByText('fallback')).toBeInTheDocument();
	});
});
