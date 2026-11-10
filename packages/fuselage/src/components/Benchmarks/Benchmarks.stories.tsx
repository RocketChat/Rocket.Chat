import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { flushSync } from 'react-dom';

import { Avatar } from '../Avatar';
import { Box } from '../Box';
import Message from '../Message/Message';
import MessageBody from '../Message/MessageBody';
import MessageContainer from '../Message/MessageContainer';
import MessageHeader from '../Message/MessageHeader';
import MessageLeftContainer from '../Message/MessageLeftContainer';
import MessageName from '../Message/MessageName';
import MessageNameContainer from '../Message/MessageNameContainer';
import MessageReactions, { MessageReaction, MessageReactionCounter } from '../Message/MessageReactions';
import MessageTimestamp from '../Message/MessageTimestamp';
import { MessageToolbar, MessageToolbarItem, MessageToolbarWrapper } from '../Message/MessageToolbar';
import MessageUsername from '../Message/MessageUsername';
import { avatarUrl } from '../Message/helpers';
import { Sidebar } from '../Sidebar';
import { GenericCondensedItem } from '../Sidebar/helpers';

declare global {
	interface Window {
		// Driven by scripts/verify/perf-bench.mjs, which reads the milliseconds each call took.
		__bench?: { mount(): number; update(): number };
	}
}

const timed = (work: () => void) => {
	const start = performance.now();
	work();
	// Reading layout forces the style and layout work the commit scheduled.
	void document.body.offsetHeight;
	return performance.now() - start;
};

const List = ({ rows, row }: { rows: number; row: (index: number, active: number) => ReactElement }) => {
	const [mounted, setMounted] = useState(true);
	const [active, setActive] = useState(0);

	window.__bench = {
		mount: () => {
			flushSync(() => setMounted(false));
			return timed(() => flushSync(() => setMounted(true)));
		},
		update: () => timed(() => flushSync(() => setActive((current) => (current + 1) % rows))),
	};

	return mounted ? <>{Array.from({ length: rows }, (_, index) => row(index, active))}</> : null;
};

export default {
	title: 'Benchmarks/Lists',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export const Messages: StoryObj = {
	render: () => (
		<Box width='x600'>
			<List
				rows={150}
				row={(index, active) => (
					<Message key={index} isSelected={index === active} clickable>
						<MessageLeftContainer>
							<Avatar url={avatarUrl} size='x36' />
						</MessageLeftContainer>
						<MessageContainer>
							<MessageHeader>
								<MessageNameContainer>
									<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
								</MessageNameContainer>
								<MessageTimestamp>12:00 PM</MessageTimestamp>
							</MessageHeader>
							<MessageBody>
								Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat a duis aute irure
								dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
							</MessageBody>
							<MessageReactions>
								<MessageReaction mine>
									<MessageReactionCounter counter={1} />
								</MessageReaction>
								<MessageReaction>
									<MessageReactionCounter counter={2} />
								</MessageReaction>
							</MessageReactions>
						</MessageContainer>
						<MessageToolbarWrapper>
							<MessageToolbar>
								<MessageToolbarItem icon='quote' />
								<MessageToolbarItem icon='thread' />
							</MessageToolbar>
						</MessageToolbarWrapper>
					</Message>
				)}
			/>
		</Box>
	),
};

export const SidebarItems: StoryObj = {
	render: () => (
		<Box width='x280'>
			<Sidebar>
				<List rows={200} row={(index) => <GenericCondensedItem key={index} i={index} />} />
			</Sidebar>
		</Box>
	),
};
