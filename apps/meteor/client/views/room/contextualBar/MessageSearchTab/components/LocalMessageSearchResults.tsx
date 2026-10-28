import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { MessageDivider } from '@rocket.chat/fuselage';

import LocalMessageSearchHit from './LocalMessageSearchHit';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { LocalSearchResultList } from '../layout/LocalSearchResultList';
import LocalSearchResultListItem from '../layout/LocalSearchResultListItem';

type LocalMessageSearchResultsProps = {
	id: string;
	hits: E2EESearchHit[];
	showUserAvatar: boolean;
};

const LocalMessageSearchResults = ({ id, hits, showUserAvatar }: LocalMessageSearchResultsProps) => {
	const formatDate = useFormatDate();

	return (
		<LocalSearchResultList id={id}>
			{hits.map((hit, index) => {
				const day = formatDate(hit.ts);
				const newDay = index === 0 || formatDate(hits[index - 1].ts) !== day;
				return (
					<LocalSearchResultListItem key={hit.id}>
						{newDay && <MessageDivider>{day}</MessageDivider>}
						<LocalMessageSearchHit hit={hit} showUserAvatar={showUserAvatar} />
					</LocalSearchResultListItem>
				);
			})}
		</LocalSearchResultList>
	);
};

export default LocalMessageSearchResults;
