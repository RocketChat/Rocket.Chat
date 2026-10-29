import { MessageBody, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageMarkupProps } from './contexts/MessageRenderersContext';
import { useMessageRenderers } from './contexts/MessageRenderersContext';

export type MessageContentBodyProps = MessageMarkupProps & Omit<ComponentProps<typeof MessageBody>, keyof MessageMarkupProps>;

const MessageContentBody = ({ md, msg, mentions, channels, searchText, ...props }: MessageContentBodyProps) => {
	const { t } = useTranslation();
	const { Markup } = useMessageRenderers();

	return (
		<MessageBody role='document' aria-roledescription={t('message_body')} dir='auto' {...props}>
			<Suspense fallback={<Skeleton />}>
				<Markup md={md} msg={msg} mentions={mentions} channels={channels} searchText={searchText} />
			</Suspense>
		</MessageBody>
	);
};

export default MessageContentBody;
