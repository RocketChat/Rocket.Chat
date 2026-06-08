import { MessageHighlight } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { memo, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

const NUMERIC_PATTERN = /^\d+$/;
const SAFE_URL_SCHEME = /^https?:\/\//i;

type ChannelMentionElementProps = {
	mention: string;
};

const handleChannelMention = (mention: string, withSymbol: boolean | undefined): string => (withSymbol ? `#${mention}` : mention);

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const { t } = useTranslation();
	const { resolveChannelMention, onChannelMentionClick, showMentionSymbol, issueLinksTemplate } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveChannelMention?.(mention), [mention, resolveChannelMention]);
	const handleClick = useMemo(() => (resolved ? onChannelMentionClick?.(resolved) : undefined), [resolved, onChannelMentionClick]);
	const buttonProps = useButtonPattern((e) => handleClick?.(e));

	if (!resolved) {
		if (NUMERIC_PATTERN.test(mention) && issueLinksTemplate) {
			const href = issueLinksTemplate.replace('%s', mention);
			if (!SAFE_URL_SCHEME.test(href)) {
				return <>#{mention}</>;
			}
			return (
				<a href={href} target='_blank' rel='noopener noreferrer'>
					#{mention}
				</a>
			);
		}
		return <>#{mention}</>;
	}

	return (
		<MessageHighlight title={t('Mentions_channel')} variant='link' clickable {...buttonProps}>
			{handleChannelMention(resolved.fname ?? mention, showMentionSymbol)}
		</MessageHighlight>
	);
};

export default memo(ChannelMentionElement);
