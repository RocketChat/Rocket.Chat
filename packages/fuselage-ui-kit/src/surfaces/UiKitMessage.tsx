import type * as UiKit from '@rocket.chat/ui-kit';
import { Fragment } from 'react';

import { FuselageMessageSurfaceRenderer } from './FuselageMessageSurfaceRenderer';
import MessageSurface from './MessageSurface';
import { MessageBlockWidth, sizesItselfInMessage } from '../utils/messageBlockWidth';

export const messageParser = new FuselageMessageSurfaceRenderer();

const topLevelBlocks = (blocks: readonly UiKit.LayoutBlock[], conditions: UiKit.Conditions): readonly UiKit.LayoutBlock[] =>
	blocks.flatMap((block) => {
		if (block.type !== 'conditional') {
			return [block];
		}

		return messageParser.render([block], conditions).length ? block.render : [];
	});

/** Draws a message's blocks, capping each top-level block to the message block width unless it sizes itself. */
export const UiKitMessage = (blocks: readonly UiKit.LayoutBlock[], conditions: UiKit.Conditions = {}) => {
	const allConditions: UiKit.Conditions = { engine: 'rocket.chat', ...conditions };

	return (
		<MessageSurface>
			{topLevelBlocks(blocks, allConditions).map((block, index) => {
				const [element] = messageParser.render([block], allConditions);

				if (!element) {
					return null;
				}

				return <Fragment key={index}>{sizesItselfInMessage(block) ? element : <MessageBlockWidth>{element}</MessageBlockWidth>}</Fragment>;
			})}
		</MessageSurface>
	);
};
