import { ComposerMarkup, ComposerMarkupContext, type ComposerMarkupContextValue } from '@rocket.chat/gazzodown-alt';
import type { Root } from '@rocket.chat/message-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const renderComposerMarkup = (tokens: Root, source: string, context: ComposerMarkupContextValue = {}): string => {
	const contextValue: ComposerMarkupContextValue = { ...context, source };

	return renderToStaticMarkup(createElement(ComposerMarkupContext.Provider, { value: contextValue }, createElement(ComposerMarkup, { tokens })));
};
