import { Callout, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';
import type { SearchIndexSessionStatus } from '../../../../../lib/e2eeSearch/searchIndexSession';
import LocalSearchIndexStatusPanel from '../layout/LocalSearchIndexStatusPanel';

export type LocalSearchIndexStatusProps = {
	progress?: SearchIndexProgress;
	encryptedAtRest?: boolean;
	status?: SearchIndexSessionStatus;
};

const isIndexing = (progress: SearchIndexProgress | undefined): progress is SearchIndexProgress =>
	!!progress && progress.status !== 'done' && progress.status !== 'stopped' && progress.roomsDone < progress.rooms;

const LocalSearchIndexStatus = ({ progress, encryptedAtRest, status }: LocalSearchIndexStatusProps) => {
	const { t } = useTranslation();
	if (status === 'locked' || status === 'unavailable' || status === 'idle') {
		return (
			<LocalSearchIndexStatusPanel>
				<Callout type='warning' role='status'>
					{status === 'locked' ? t('E2E_Local_Search_Locked') : t('E2E_Local_Search_Unavailable')}
				</Callout>
			</LocalSearchIndexStatusPanel>
		);
	}
	const memoryOnly = encryptedAtRest === false;
	const indexing = isIndexing(progress);

	if (!indexing && !memoryOnly) return null;

	return (
		<LocalSearchIndexStatusPanel>
			{memoryOnly && <Callout type='info'>{t('E2E_Local_Search_Memory_Only')}</Callout>}
			{indexing && (
				<Text role='status' fontScale='c1' color='hint' data-qa='local-search-index-progress'>
					{t('E2E_Local_Search_Indexing_Progress', { done: progress.roomsDone, count: progress.rooms })}
				</Text>
			)}
		</LocalSearchIndexStatusPanel>
	);
};

export default LocalSearchIndexStatus;
