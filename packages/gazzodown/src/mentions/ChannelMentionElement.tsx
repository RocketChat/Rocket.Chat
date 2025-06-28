import { Message } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { memo, ReactElement, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const handleChannelMention = (mention: string, withSymbol: boolean | undefined): string => (withSymbol ? `#${mention}` : mention);

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const { t } = useTranslation();
	const { resolveChannelMention, onChannelMentionClick, showMentionSymbol } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);
	const buttonProps = useButtonPattern((e) => handleClick?.(e));

	if (!resolved) {
		return <>#{mention}</>;
	}

	return (
		<Message.Highlight title={t('Mentions_channel')} variant='link' clickable {...buttonProps}>
			{handleChannelMention(resolved.fname ?? mention, showMentionSymbol)}
		</Message.Highlight>
	);
};

export default memo(ChannelMentionElement);
