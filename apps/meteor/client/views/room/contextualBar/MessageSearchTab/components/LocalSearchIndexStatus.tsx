import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { Box, Callout, IconButton, Text } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useId, useState } from 'react';
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
 * After that, a note tells that the search of this room covers its encrypted messages. It shows only its title until the
 * user expands it, as it stays above every search of the room.
 */
const LocalSearchIndexStatus = ({ backend, rid }: LocalSearchIndexStatusProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const progress = useLocalSearchIndexProgress();
	const memoryOnly = useLocalSearchIndexEncryptedAtRest() === false;
	const coverage = useLocalSearchIndexRoomCoverage(backend, rid, !!progress);
	const roomPending = isIndexing(progress) && coverage?.done === false;
	const roomIndexed = coverage?.done === true;
	const [detailsShown, setDetailsShown] = useState(false);
	const detailsId = useId();

	if (!roomPending && !roomIndexed && !memoryOnly) return null;

	return (
		<LocalSearchIndexStatusPanel>
			{roomIndexed && (
				<Callout
					type='success'
					// The toggle sits in the title row: the actions of a narrow callout take a row of their own.
					title={
						<Box display='flex' alignItems='center' justifyContent='space-between'>
							{t('E2E_Local_Search_Room_Indexed_Title')}
							<IconButton
								icon={detailsShown ? 'chevron-up' : 'chevron-down'}
								size='mini'
								title={detailsShown ? t('Collapse') : t('Expand')}
								aria-expanded={detailsShown}
								aria-controls={detailsId}
								onClick={() => setDetailsShown((shown) => !shown)}
							/>
						</Box>
					}
					role='status'
					data-qa='local-search-room-indexed'
				>
					{detailsShown && (
						<Text is='p' id={detailsId}>
							{t('E2E_Local_Search_Room_Indexed_Description')}
						</Text>
					)}
				</Callout>
			)}
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
