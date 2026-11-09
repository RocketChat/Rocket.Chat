import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { Callout, Text } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';
import { useLocalSearchIndexEncryptedAtRest } from '../hooks/useLocalSearchIndexEncryptedAtRest';
import { useLocalSearchIndexProgress } from '../hooks/useLocalSearchIndexProgress';
import { useLocalSearchIndexRoomCoverage } from '../hooks/useLocalSearchIndexRoomCoverage';
import LocalSearchIndexStatusPanel from '../layout/LocalSearchIndexStatusPanel';

const isIndexing = (progress: SearchIndexProgress | undefined): progress is SearchIndexProgress =>
	!!progress && progress.status !== 'done' && progress.status !== 'stopped' && progress.roomsDone < progress.rooms;

type LocalSearchIndexStatusProps = {
	backend: ISearchIndexBackend | undefined;
	rid: string;
};

/**
 * The state of the local search index of decrypted E2EE messages, above the local search results. The search covers one
 * room, so the progress line tells how far back the index holds the history of this room, until its backfill is done.
 */
const LocalSearchIndexStatus = ({ backend, rid }: LocalSearchIndexStatusProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const progress = useLocalSearchIndexProgress();
	const memoryOnly = useLocalSearchIndexEncryptedAtRest() === false;
	const coverage = useLocalSearchIndexRoomCoverage(backend, rid, isIndexing(progress));
	const roomPending = coverage?.done === false;

	if (!roomPending && !memoryOnly) return null;

	return (
		<LocalSearchIndexStatusPanel>
			{memoryOnly && <Callout type='info'>{t('E2E_Local_Search_Memory_Only')}</Callout>}
			{roomPending && (
				<Text role='status' fontScale='c1' color='hint' data-qa='local-search-index-progress'>
					{coverage.since === undefined
						? t('E2E_Local_Search_Room_Not_Indexed_Yet')
						: t('E2E_Local_Search_Room_Indexed_Since', { date: formatDateAndTime(coverage.since) })}
				</Text>
			)}
		</LocalSearchIndexStatusPanel>
	);
};

export default LocalSearchIndexStatus;
