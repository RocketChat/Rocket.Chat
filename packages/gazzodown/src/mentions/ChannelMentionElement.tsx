import { Message } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { memo, ReactElement, useContext, useMemo, KeyboardEvent } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const handleChannelMention = (mention: string, withSymbol: boolean | undefined): string => (withSymbol ? `#${mention}` : mention);

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const t = useTranslation();
	const { resolveChannelMention, onChannelMentionClick, showMentionSymbol } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);

	if (!resolved) {
		return <>#{mention}</>;
	}

	return (
		<Message.Highlight
			title={t('Mentions_channel')}
			tabIndex={0}
			role='button'
			variant='link'
			clickable
			onClick={handleClick}
			onKeyDown={(e: KeyboardEvent<HTMLSpanElement>): void => {
				(e.code === 'Enter' || e.code === 'Space') && handleClick?.(e);
			}}
		>
			{handleChannelMention(resolved.fname ?? mention, showMentionSymbol)}
		</Message.Highlight>
	);
};

export default memo(ChannelMentionElement);
