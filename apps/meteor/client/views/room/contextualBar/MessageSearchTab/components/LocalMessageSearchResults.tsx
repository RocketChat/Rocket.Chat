import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { Box, MessageDivider } from '@rocket.chat/fuselage';

import LocalMessageSearchHit from './LocalMessageSearchHit';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

type LocalMessageSearchResultsProps = {
	id: string;
	hits: E2EESearchHit[];
	showUserAvatar: boolean;
};

const LocalMessageSearchResults = ({ id, hits, showUserAvatar }: LocalMessageSearchResultsProps) => {
	const formatDate = useFormatDate();

	return (
		<Box
			id={id}
			is='ul'
			role='list'
			display='flex'
			flexDirection='column'
			overflowY='auto'
			flexGrow={1}
			data-qa='local-message-search-results'
		>
			{hits.map((hit, index) => {
				const day = formatDate(hit.ts);
				const newDay = index === 0 || formatDate(hits[index - 1].ts) !== day;
				return (
					<Box is='li' key={hit.id}>
						{newDay && <MessageDivider>{day}</MessageDivider>}
						<LocalMessageSearchHit hit={hit} showUserAvatar={showUserAvatar} />
					</Box>
				);
			})}
		</Box>
	);
};

export default LocalMessageSearchResults;
