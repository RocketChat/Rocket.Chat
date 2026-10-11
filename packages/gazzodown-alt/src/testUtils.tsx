import { parse } from '@rocket.chat/message-parser';
import type { Root } from '@rocket.chat/message-parser';
import { renderToStaticMarkup } from 'react-dom/server';

import ComposerInlineElements from './ComposerInlineElements';
import ComposerMarkup from './ComposerMarkup';
import { ComposerMarkupContext, type ComposerMarkupContextValue } from './ComposerMarkupContext';
import { renderComposerMarkup } from './renderComposerMarkup';

type InlineChildren = Parameters<typeof ComposerInlineElements>[0]['children'];

const mount = (markup: string): HTMLDivElement => {
	const input = document.createElement('div');

	input.innerHTML = markup;

	return input;
};

export const mountTokens = (tokens: Root, source = ''): HTMLDivElement => mount(renderComposerMarkup(tokens, source));

export const mountSource = (text: string): HTMLDivElement => mountTokens(parse(text, {}), text);

export const mountBareTokens = (tokens: Root): HTMLDivElement => mount(renderToStaticMarkup(<ComposerMarkup tokens={tokens} />));

export const mountInline = (children: InlineChildren, context: ComposerMarkupContextValue = {}): HTMLDivElement =>
	mount(
		renderToStaticMarkup(
			<ComposerMarkupContext.Provider value={context}>
				<ComposerInlineElements>{children}</ComposerInlineElements>
			</ComposerMarkupContext.Provider>,
		),
	);

export const textOf = (input: HTMLElement): string => (input.textContent ?? '').replace(/\n$/, '');

export const anchorsOf = (input: HTMLElement): HTMLAnchorElement[] => Array.from(input.querySelectorAll('a'));
