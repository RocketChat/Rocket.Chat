import { MessageDivider } from '@rocket.chat/fuselage';
import { isSameDay } from 'date-fns/isSameDay';
import { useCallback } from 'react';
import type { UIEvent } from 'react';

import type { LocalSearchHit } from './LocalMessageSearchHit';
import LocalMessageSearchHit from './LocalMessageSearchHit';
import LocalSearchResultList from './layout/LocalSearchResultList';
import LocalSearchResultListItem from './layout/LocalSearchResultListItem';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import { useMessageRowListNavigation } from '../../../hooks/useMessageRowListNavigation';

export type LocalMessageSearchResultsProps = {
	id: string;
	hits: readonly LocalSearchHit[];
	showUserAvatar: boolean;
	onOpenHit: (hit: LocalSearchHit) => void;
	onEndReached?: () => void;
};

const END_REACHED_THRESHOLD = 200;

const isAtEnd = (element: HTMLElement) => element.scrollTop + element.clientHeight >= element.scrollHeight - END_REACHED_THRESHOLD;

const LocalMessageSearchResults = ({ id, hits, showUserAvatar, onOpenHit, onEndReached }: LocalMessageSearchResultsProps) => {
	const formatDate = useFormatDate();
	const navigationRef = useMessageRowListNavigation();
	const observeEndRef = useCallback(
		(list: HTMLElement) => {
			if (!onEndReached) return;

			const loadIfAtEnd = () => {
				if (isAtEnd(list)) onEndReached();
			};
			loadIfAtEnd();

			const sizeOf = () => `${list.clientWidth}x${list.clientHeight}`;
			let size = sizeOf();
			const observer = new ResizeObserver(() => {
				if (sizeOf() === size) return;
				size = sizeOf();
				loadIfAtEnd();
			});
			observer.observe(list);
			return () => observer.disconnect();
		},
		[hits.length, onEndReached],
	);
	const ref = useMergedRefsV2(navigationRef, observeEndRef);

	const handleScroll = (event: UIEvent<HTMLElement>) => {
		if (onEndReached && isAtEnd(event.currentTarget)) onEndReached();
	};

	return (
		<LocalSearchResultList id={id} ref={ref} onScroll={handleScroll}>
			{hits.map((hit, index) => (
				<LocalSearchResultListItem key={hit.id}>
					{(index === 0 || !isSameDay(hit.ts, hits[index - 1].ts)) && <MessageDivider>{formatDate(hit.ts)}</MessageDivider>}
					<LocalMessageSearchHit hit={hit} showUserAvatar={showUserAvatar} onOpenHit={onOpenHit} />
				</LocalSearchResultListItem>
			))}
		</LocalSearchResultList>
	);
};

export default LocalMessageSearchResults;
