import { MessageBody, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import React, { Suspense } from 'react';

import type { MessageWithMdEnforced } from '../../lib/parseMessageTextToAstMarkdown';
import GazzodownText from '../GazzodownText';
import ShortURLInMessage from './content/actions/MessageURLShortner';

type MessageContentBodyProps = Pick<MessageWithMdEnforced, 'mentions' | 'channels' | 'md'> & {
	searchText?: string;
};

const MessageContentBody = ({ mentions, channels, md, searchText }: MessageContentBodyProps) => (
	<MessageBody data-qa-type='message-body' dir='auto'>
		<Suspense fallback={<Skeleton />}>
			<GazzodownText channels={channels} mentions={mentions} searchText={searchText}>
				<Markup tokens={ShortURLInMessage(md)} />
			</GazzodownText>
		</Suspense>
	</MessageBody>
);

export default MessageContentBody;
