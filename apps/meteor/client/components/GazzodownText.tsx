import type { IRoom } from '@rocket.chat/core-typings';
import type { UserMention } from '@rocket.chat/gazzodown';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type { ReactNode } from 'react';
import { useCallback, memo, useMemo } from 'react';

import { GazzodownEnvironmentProvider, useGazzodownEnvironment } from './GazzodownEnvironment';
import { normalizeUsername } from '../../lib/utils/normalizeUsername';
import { detectEmoji } from '../lib/utils/detectEmoji';

export type GazzodownTextProps = {
	children: ReactNode;
	mentions?: {
		type?: 'user' | 'team';
		_id: string;
		username?: string;
		name?: string;
	}[];
	channels?: Pick<IRoom, '_id' | 'name'>[];
	searchText?: string;
};

const GazzodownText = (props: GazzodownTextProps) => {
	const { mentions, channels, searchText, children } = props;
	const environment = useGazzodownEnvironment();

	const markRegex = useMemo(() => {
		if (!searchText) {
			return;
		}

		return (): RegExp => new RegExp(`(${searchText})(?![^<]*>)`, 'gi');
	}, [searchText]);

	const resolveUserMention = useCallback(
		(mention: string) => {
			if (mention === 'all' || mention === 'here') {
				return undefined;
			}

			const filterUser = ({ username, type }: UserMention) => {
				if (!username || type === 'team') return false;
				return normalizeUsername(username) === normalizeUsername(mention);
			};
			const filterTeam = ({ name, type }: UserMention) => type === 'team' && name === mention;

			return mentions?.find((mention) => filterUser(mention) || filterTeam(mention));
		},
		[mentions],
	);

	const resolveChannelMention = useCallback((mention: string) => channels?.find(({ name }) => name === mention), [channels]);

	const interaction = useMemo(
		() =>
			environment && {
				detectEmoji,
				highlightRegex: environment.highlightRegex,
				markRegex,
				resolveUserMention,
				onUserMentionClick: environment.onUserMentionClick,
				resolveChannelMention,
				onChannelMentionClick: environment.onChannelMentionClick,
				convertAsciiToEmoji: environment.convertAsciiToEmoji,
				useEmoji: environment.useEmoji,
				useRealName: environment.useRealName,
				isMobile: environment.isMobile,
				ownUserId: environment.ownUserId,
				showMentionSymbol: environment.showMentionSymbol,
				triggerProps: environment.triggerProps,
				language: environment.language,
			},
		[environment, markRegex, resolveUserMention, resolveChannelMention],
	);

	// Message lists provide the environment once; a block rendered on its own reads it for itself.
	if (!interaction) {
		return (
			<GazzodownEnvironmentProvider>
				<GazzodownText {...props} />
			</GazzodownEnvironmentProvider>
		);
	}

	return <MarkupInteractionContext.Provider value={interaction}>{children}</MarkupInteractionContext.Provider>;
};

export default memo(GazzodownText);
