import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { MessageDivider } from '@rocket.chat/fuselage';
import { isSameDay } from 'date-fns/isSameDay';
import { useEffect, useRef } from 'react';
import type { UIEvent } from 'react';

import LocalMessageSearchHit from './LocalMessageSearchHit';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { LocalSearchResultList } from '../layout/LocalSearchResultList';
import LocalSearchResultListItem from '../layout/LocalSearchResultListItem';

type LocalMessageSearchResultsProps = {
	id: string;
	hits: E2EESearchHit[];
	showUserAvatar: boolean;
	/** Called when the user scrolls to the end of the list, or when the list does not fill its space: more hits may exist. */
	onEndReached?: () => void;
};

/** How close to the end of the list, in pixels, the next hits start to load. */
const END_REACHED_THRESHOLD = 200;

const isAtEnd = (element: HTMLElement) => element.scrollTop + element.clientHeight >= element.scrollHeight - END_REACHED_THRESHOLD;

const LocalMessageSearchResults = ({ id, hits, showUserAvatar, onEndReached }: LocalMessageSearchResultsProps) => {
	const formatDate = useFormatDate();
	const listRef = useRef<HTMLElement>(null);

	// A first page that does not fill the panel cannot scroll, so the next one loads at once.
	useEffect(() => {
		if (onEndReached && listRef.current && isAtEnd(listRef.current)) onEndReached();
	}, [hits.length, onEndReached]);

	const handleScroll = (event: UIEvent<HTMLElement>) => {
		if (onEndReached && isAtEnd(event.currentTarget)) onEndReached();
	};

	return (
		<LocalSearchResultList id={id} ref={listRef} onScroll={handleScroll}>
			{hits.map((hit, index) => {
				// The date format can hold a time, so the divider compares calendar days, not the formatted text.
				const newDay = index === 0 || !isSameDay(hit.ts, hits[index - 1].ts);
				return (
					<LocalSearchResultListItem key={hit.id}>
						{newDay && <MessageDivider>{formatDate(hit.ts)}</MessageDivider>}
						<LocalMessageSearchHit hit={hit} showUserAvatar={showUserAvatar} />
					</LocalSearchResultListItem>
				);
			})}
		</LocalSearchResultList>
	);
};

export default LocalMessageSearchResults;
