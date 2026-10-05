import { ComposerMarkup, ComposerMarkupContext, type ComposerMarkupContextValue } from '@rocket.chat/gazzodown-alt';
import type { Root } from '@rocket.chat/message-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const renderComposerMarkup = (tokens: Root, source: string): string => {
	const context: ComposerMarkupContextValue = { source };

	return renderToStaticMarkup(createElement(ComposerMarkupContext.Provider, { value: context }, createElement(ComposerMarkup, { tokens })));
};
