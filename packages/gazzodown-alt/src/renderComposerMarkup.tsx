import type { Root } from '@rocket.chat/message-parser';
import { renderToStaticMarkup } from 'react-dom/server';

import ComposerMarkup from './ComposerMarkup.js';
import { ComposerMarkupContext } from './ComposerMarkupContext.js';

export const renderComposerMarkup = (tokens: Root, source: string): string =>
	renderToStaticMarkup(
		<ComposerMarkupContext.Provider value={{ source }}>
			<ComposerMarkup tokens={tokens} />
		</ComposerMarkupContext.Provider>,
	);
