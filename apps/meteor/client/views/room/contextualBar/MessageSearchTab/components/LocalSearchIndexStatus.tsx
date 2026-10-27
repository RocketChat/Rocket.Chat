import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';
import { useLocalSearchIndexEncryptedAtRest } from '../hooks/useLocalSearchIndexEncryptedAtRest';
import { useLocalSearchIndexProgress } from '../hooks/useLocalSearchIndexProgress';

// The scheduler waits while the user is active, so `waiting-for-idle` also counts as indexing: the history is not complete.
const isIndexing = (progress: SearchIndexProgress | undefined): progress is SearchIndexProgress =>
	!!progress && progress.status !== 'done' && progress.status !== 'stopped' && progress.roomsDone < progress.rooms;

/** The state of the local search index of decrypted E2EE messages, above the local search results. */
const LocalSearchIndexStatus = () => {
	const { t } = useTranslation();
	const progress = useLocalSearchIndexProgress();
	const memoryOnly = useLocalSearchIndexEncryptedAtRest() === false;
	const indexing = isIndexing(progress);

	if (!indexing && !memoryOnly) return null;

	return (
		<Box paddingInline={16} paddingBlockStart={12} display='flex' flexDirection='column' gap={8}>
			{memoryOnly && <Callout type='info'>{t('E2E_Local_Search_Memory_Only')}</Callout>}
			{indexing && (
				<Box fontScale='c1' color='hint' data-qa='local-search-index-progress'>
					{t('E2E_Local_Search_Indexing_Progress', { done: progress.roomsDone, total: progress.rooms })}
				</Box>
			)}
		</Box>
	);
};

export default LocalSearchIndexStatus;
