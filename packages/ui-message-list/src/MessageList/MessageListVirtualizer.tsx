import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactNode, RefObject } from 'react';
import type { CacheSnapshot, VirtualizerHandle } from 'virtua';
import { Virtualizer } from 'virtua';

import { edgeSpacing } from './edgeSpacing';
import type { MessageListRow } from './lib/buildMessageListRows';

export type MessageListVirtualizerProps<TMessage extends IMessage> = {
	ref: RefObject<VirtualizerHandle | null>;
	scrollRef: RefObject<HTMLElement | null>;
	rows: readonly MessageListRow<TMessage>[];
	shift: boolean;
	cache: CacheSnapshot | undefined;
	keepMounted: readonly number[];
	/** Space above the first row and below the last one, in pixels, measured as part of those rows. */
	startSpacing: number;
	endSpacing: number;
	onScroll: () => void;
	onScrollEnd: () => void;
	children: (row: MessageListRow<TMessage>, index: number) => ReactNode;
};

/**
 * Renders only the rows in view. Specs replace this module with `MessageListRows`, since the virtualizer cannot measure
 * anything in jsdom.
 */
const MessageListVirtualizer = <TMessage extends IMessage>({
	ref,
	scrollRef,
	rows,
	shift,
	cache,
	keepMounted,
	startSpacing,
	endSpacing,
	onScroll,
	onScrollEnd,
	children,
}: MessageListVirtualizerProps<TMessage>) => (
	<Virtualizer
		ref={ref}
		scrollRef={scrollRef}
		data={rows}
		shift={shift}
		cache={cache}
		keepMounted={keepMounted}
		onScroll={onScroll}
		onScrollEnd={onScrollEnd}
	>
		{(row, index) => (
			<div key={row.key} style={edgeSpacing(index, rows.length, startSpacing, endSpacing)}>
				{children(row, index)}
			</div>
		)}
	</Virtualizer>
);

export default MessageListVirtualizer;
