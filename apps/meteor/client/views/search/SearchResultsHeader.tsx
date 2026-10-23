import type { AppliedFilter } from '@rocket.chat/ai-search';
import { serializeSearchQuery } from '@rocket.chat/ai-search';
import { Box, Icon, Chip } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export type SearchResultsHeaderProps = {
	query: string;
	filters: AppliedFilter[];
};

const SearchResultsHeader = ({ query, filters }: SearchResultsHeaderProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='column' marginBlockEnd={40} gap={8}>
			<Box is='h1' display='flex' alignItems='center' fontScale='p1' gap={8} minWidth={0}>
				<Icon name='search-sparkle' size='x20' />
				<Box is='span' fontWeight={400} withTruncatedText>
					{query ? (
						<Trans
							i18nKey='Search_results_for'
							values={{ query }}
							tOptions={{ interpolation: { escapeValue: true } }}
							shouldUnescape
							components={{ bold: <Box is='strong' fontWeight={700} /> }}
						/>
					) : (
						t('Intelligent_Search_page_empty_state')
					)}
				</Box>
			</Box>
			<Box color='hint' fontScale='c1'>
				{t('Intelligent_Search_scope_all_rooms')}
			</Box>
			{filters.length > 0 && (
				<Box display='flex' flexWrap='wrap' gap='x8' marginBlockStart='x12'>
					{filters.map((filter) => (
						<Chip key={filter.id}>{serializeSearchQuery({ text: '', filters: [filter] })}</Chip>
					))}
				</Box>
			)}
		</Box>
	);
};

export default SearchResultsHeader;
