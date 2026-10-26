import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import SearchSnippetText from './SearchSnippetText';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

type LocalMessageSearchResultsProps = {
	id: string;
	hits: E2EESearchHit[];
};

const LocalMessageSearchResults = ({ id, hits }: LocalMessageSearchResultsProps) => {
	const { t } = useTranslation();
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
						<Box
							is='button'
							type='button'
							width='full'
							textAlign='start'
							paddingInline={24}
							paddingBlock={8}
							fontScale='p2'
							color='font-default'
							backgroundColor='transparent'
							borderWidth='none'
							title={t('Jump_to_message')}
							onClick={() => {
								void setMessageJumpQueryStringParameter(hit.id);
							}}
						>
							<Box fontScale='c1' color='font-hint' marginBlockEnd={4}>
								{new Date(hit.ts).toLocaleTimeString()}
							</Box>
							<Box style={{ wordBreak: 'break-word' }}>
								<SearchSnippetText snippet={hit.snippet} />
							</Box>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};

export default LocalMessageSearchResults;
