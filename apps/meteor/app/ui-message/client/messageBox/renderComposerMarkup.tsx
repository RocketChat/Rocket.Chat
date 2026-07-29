import { ComposerMarkup, ComposerMarkupContext, type ComposerMarkupContextValue } from '@rocket.chat/gazzodown-alt';
import type { Root } from '@rocket.chat/message-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { getEmojiClassNameAndDataTitle } from '../../../../client/lib/utils/renderEmoji';

const detectEmoji: ComposerMarkupContextValue['detectEmoji'] = (text) => {
	const { className, image, children, name } = getEmojiClassNameAndDataTitle(text);

	if (!className && !children) {
		return [];
	}

	const rawImage = image ? image.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : undefined;

	return [{ name, className: className ?? '', image: rawImage, content: children ?? '' }];
};

export const renderComposerMarkup = (tokens: Root): string => {
	const context: ComposerMarkupContextValue = { detectEmoji };

	return renderToStaticMarkup(createElement(ComposerMarkupContext.Provider, { value: context }, createElement(ComposerMarkup, { tokens })));
};
