import { MessageBody, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import UrlPreviews from './content/UrlPreviews';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { UrlWithStringQuery } from 'url';
import React, { Suspense } from 'react';

import type { MessageWithMdEnforced } from '../../lib/parseMessageTextToAstMarkdown';
import GazzodownText from '../GazzodownText';


export type MessageUrl = {
	url: string;
	source?: string;
	meta: Record<string, string>;
	headers?: { contentLength?: string; contentType?: string };
	ignoreParse?: boolean;
	parsedUrl?: Pick<UrlWithStringQuery, 'host' | 'hash' | 'pathname' | 'protocol' | 'port' | 'query' | 'search' | 'hostname'>;
};

type MessageContentBodyProps = Pick<MessageWithMdEnforced, 'mentions' | 'channels' | 'md'> & {
	searchText?: string;
	urls: MessageUrl[];
	idx: number;
};

const MessageContentBody = ({ mentions, channels, md, searchText, urls  }: MessageContentBodyProps) => (
	<MessageBody data-qa-type='message-body' dir='auto'>
		<Suspense fallback={<Skeleton />}>
			<GazzodownText channels={channels} mentions={mentions} searchText={searchText}>
				<>
				{console.log('md',md)}
					{md.map((item,index) => (
						<>
							<Markup tokens={[].concat(item as unknown as never)} />
							{item.value && Array.isArray(item.value) && item.value.some((innerItem) => innerItem.type === 'LINK') && (
								<>
								{console.log('urls',urls)}
								{console.log('test',Array(urls[index]))}
									<UrlPreviews urls={Array(urls[index])} />
								</>
							)}
						</>
					))}
				</>
				{/* <Markup tokens={md}/> */}
			</GazzodownText>
		</Suspense>
	</MessageBody>
);

export default MessageContentBody;
