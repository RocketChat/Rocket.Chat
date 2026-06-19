import { ComposerMarkup, ComposerMarkupContext, type ComposerMarkupContextValue } from '@rocket.chat/gazzodown-alt';
import type { Options, Root } from '@rocket.chat/message-parser';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { getEmojiClassNameAndDataTitle } from '../../../../client/lib/utils/renderEmoji';

const detectEmoji: ComposerMarkupContextValue['detectEmoji'] = (text) => {
	const { className, image, children, name } = getEmojiClassNameAndDataTitle(text);

	if (!className && !children) {
		return [];
	}

	const rawImage = image ? image.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : undefined;

	return [{ name, className, image: rawImage, content: children ?? '' }];
};

export const renderComposerMarkup = (tokens: Root, parseOptions: Options): string => {
	const context: ComposerMarkupContextValue = {
		detectEmoji,
		useEmoji: true,
		convertAsciiToEmoji: Boolean(parseOptions.emoticons),
	};

	return renderToStaticMarkup(createElement(ComposerMarkupContext.Provider, { value: context }, createElement(ComposerMarkup, { tokens })));
};
