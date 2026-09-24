import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ChannelMention, UserMention } from '@rocket.chat/gazzodown';
import { escapeRegExp } from '@rocket.chat/tools';
import { useLayout, useRouter, useUserPreference, useUserId, useUserCard } from '@rocket.chat/ui-contexts';
import type { ReactNode, UIEvent } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { useMessageListHighlights } from './message/list/MessageListContext';
import { useMessageListViewer } from './message/list/MessageViewerContext';
import { useGoToRoom } from '../views/room/hooks/useGoToRoom';

/** What every rendered markup block shares: the viewer's markup preferences and the mention interactions */
export type GazzodownEnvironment = {
	language: string;
	highlightRegex: (() => RegExp) | undefined;
	convertAsciiToEmoji: boolean | undefined;
	useEmoji: boolean | undefined;
	useRealName: boolean;
	ownUserId: ReturnType<typeof useUserId>;
	showMentionSymbol: boolean;
	isMobile: boolean;
	triggerProps: ReturnType<typeof useUserCard>['triggerProps'];
	onUserMentionClick: (mention: UserMention) => ((event: UIEvent) => void) | undefined;
	onChannelMentionClick: (mention: ChannelMention) => (event: UIEvent) => void;
};

export const GazzodownEnvironmentContext = createContext<GazzodownEnvironment | undefined>(undefined);

export const useGazzodownEnvironment = (): GazzodownEnvironment | undefined => useContext(GazzodownEnvironmentContext);

type GazzodownEnvironmentProviderProps = {
	children: ReactNode;
};

/** Reads the markup environment once, so a list of messages does not ask for it per message */
export const GazzodownEnvironmentProvider = ({ children }: GazzodownEnvironmentProviderProps) => {
	const [language] = useLocalStorage('userLanguage', 'en');
	const highlights = useMessageListHighlights();
	const { triggerProps, openUserCard } = useUserCard();

	const highlightRegex = useMemo(() => {
		if (!highlights?.length) {
			return;
		}

		// Due to unnecessary escaping in escapeRegExp, we need to remove the escape character for the following characters: - = ! :
		// This is necessary because it was crashing the client due to Invalid regular expression error.
		const alternatives = highlights.map(({ highlight }) => escapeRegExp(highlight).replace(/\\([-=!:])/g, '$1')).join('|');
		const expression = `(?<=^|[\\p{P}\\p{Z}])(${alternatives})(?=$|[\\p{P}\\p{Z}])`;

		return (): RegExp => new RegExp(expression, 'gmiu');
	}, [highlights]);

	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);
	const useEmoji = useUserPreference<boolean>('useEmojis', true);
	const { useRealName } = useMessageListViewer();
	const ownUserId = useUserId();
	const showMentionSymbol = Boolean(useUserPreference<boolean>('mentionsWithSymbol'));
	const { isEmbedded, isMobile } = useLayout();
	const router = useRouter();
	const goToRoom = useGoToRoom();

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

	const environment = useMemo(
		(): GazzodownEnvironment => ({
			language,
			highlightRegex,
			convertAsciiToEmoji,
			useEmoji,
			useRealName,
			ownUserId,
			showMentionSymbol,
			isMobile,
			triggerProps,
			onUserMentionClick,
			onChannelMentionClick,
		}),
		[
			language,
			highlightRegex,
			convertAsciiToEmoji,
			useEmoji,
			useRealName,
			ownUserId,
			showMentionSymbol,
			isMobile,
			triggerProps,
			onUserMentionClick,
			onChannelMentionClick,
		],
	);

	return <GazzodownEnvironmentContext.Provider value={environment}>{children}</GazzodownEnvironmentContext.Provider>;
};
