import { Callout, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';
import { useLocalSearchIndexEncryptedAtRest } from '../hooks/useLocalSearchIndexEncryptedAtRest';
import { useLocalSearchIndexProgress } from '../hooks/useLocalSearchIndexProgress';
import LocalSearchIndexStatusPanel from '../layout/LocalSearchIndexStatusPanel';

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
		<LocalSearchIndexStatusPanel>
			{memoryOnly && <Callout type='info'>{t('E2E_Local_Search_Memory_Only')}</Callout>}
			{indexing && (
				<Text fontScale='c1' color='hint' data-qa='local-search-index-progress'>
					{t('E2E_Local_Search_Indexing_Progress', { done: progress.roomsDone, total: progress.rooms })}
				</Text>
			)}
		</LocalSearchIndexStatusPanel>
	);
};

export default LocalSearchIndexStatus;
