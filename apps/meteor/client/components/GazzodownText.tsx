import type { IRoom } from '@rocket.chat/core-typings';
import type { ChannelMention, UserMention } from '@rocket.chat/gazzodown';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useLayout, useRouter, useSetting, useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import type { UIEvent } from 'react';
import React, { useCallback, memo, useMemo } from 'react';

import { detectEmoji } from '../lib/utils/detectEmoji';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { useUserCard } from '../views/room/contexts/UserCardContext';
import { useGoToRoom } from '../views/room/hooks/useGoToRoom';
import { useMessageListHighlights } from './message/list/MessageListContext';

type GazzodownTextProps = {
	children: JSX.Element;
	mentions?: {
		type?: 'user' | 'team';
		_id: string;
		username?: string;
		name?: string;
	}[];
	channels?: Pick<IRoom, '_id' | 'name'>[];
	searchText?: string;
};

const GazzodownText = ({ mentions, channels, searchText, children }: GazzodownTextProps) => {
	const highlights = useMessageListHighlights();
	const { triggerProps, openUserCard } = useUserCard();

	const highlightRegex = useMemo(() => {
		if (!highlights?.length) {
			return;
		}

		const alternatives = highlights.map(({ highlight }) => escapeRegExp(highlight)).join('|');
		const expression = `(?=^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${alternatives})(?=$|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])`;

		return (): RegExp => new RegExp(expression, 'gmi');
	}, [highlights]);

	const markRegex = useMemo(() => {
		if (!searchText) {
			return;
		}

		return (): RegExp => new RegExp(`(${searchText})(?![^<]*>)`, 'gi');
	}, [searchText]);

	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);
	const useEmoji = Boolean(useUserPreference('useEmojis'));
	const useRealName = Boolean(useSetting('UI_Use_Real_Name'));
	const ownUserId = useUserId();
	const showMentionSymbol = Boolean(useUserPreference<boolean>('mentionsWithSymbol'));

	const resolveUserMention = useCallback(
		(mention: string) => {
			if (mention === 'all' || mention === 'here') {
				return undefined;
			}

			const filterUser = ({ username, type }: UserMention) => (!type || type === 'user') && username === mention;
			const filterTeam = ({ name, type }: UserMention) => type === 'team' && name === mention;

			return mentions?.find((mention) => filterUser(mention) || filterTeam(mention));
		},
		[mentions],
	);

	const onUserMentionClick = useCallback(
		({ username }: UserMention) => {
			if (!username) {
				return;
			}

			return (event: UIEvent): void => {
				event.stopPropagation();
				openUserCard(event, username);
			};
		},
		[openUserCard],
	);

	const goToRoom = useGoToRoom();

	const { isEmbedded, isMobile } = useLayout();

	const resolveChannelMention = useCallback((mention: string) => channels?.find(({ name }) => name === mention), [channels]);

	const router = useRouter();

	const onChannelMentionClick = useCallback(
		({ _id: rid }: ChannelMention) =>
			(event: UIEvent): void => {
				if (isEmbedded) {
					fireGlobalEvent('click-mention-link', {
						path: router.buildRoutePath({
							pattern: '/channel/:name/:tab?/:context?',
							params: { name: rid },
						}),
						channel: rid,
					});
				}

				event.stopPropagation();
				goToRoom(rid);
			},
		[router, isEmbedded, goToRoom],
	);

	return (
		<MarkupInteractionContext.Provider
			value={{
				detectEmoji,
				highlightRegex,
				markRegex,
				resolveUserMention,
				onUserMentionClick,
				resolveChannelMention,
				onChannelMentionClick,
				convertAsciiToEmoji,
				useEmoji,
				useRealName,
				isMobile,
				ownUserId,
				showMentionSymbol,
				triggerProps,
			}}
		>
			{children}
		</MarkupInteractionContext.Provider>
	);
};

export default memo(GazzodownText);
