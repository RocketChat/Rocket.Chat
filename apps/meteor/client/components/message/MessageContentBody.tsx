import { MessageBody, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import type { ComponentProps } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageWithMdEnforced } from '../../lib/parseMessageTextToAstMarkdown';
import GazzodownText from '../GazzodownText';

type MessageContentBodyProps = Pick<MessageWithMdEnforced, 'mentions' | 'channels' | 'md'> & {
	searchText?: string;
} & ComponentProps<typeof MessageBody>;

const MessageContentBody = ({ mentions, channels, md, searchText, ...props }: MessageContentBodyProps) => {
	const { t } = useTranslation();

	return (
		<MessageBody role='document' aria-roledescription={t('message_body')} dir='auto' {...props}>
			<Suspense fallback={<Skeleton />}>
				<GazzodownText channels={channels} mentions={mentions} searchText={searchText}>
					<Markup tokens={md} />
				</GazzodownText>
			</Suspense>
		</MessageBody>
	);
};

export default MessageContentBody;
