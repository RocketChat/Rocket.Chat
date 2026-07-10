import type { ICronHistoryItem, Serialized } from '@rocket.chat/core-typings';
import { Box, Card, CardBody, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { formatDuration, statusVariant } from './helpers';

type BackgroundJobHistoryCardProps = {
	entry: Serialized<ICronHistoryItem>;
	formatDateAndTime: (date: string | Date) => string;
};

const BackgroundJobHistoryCard = ({ entry, formatDateAndTime }: BackgroundJobHistoryCardProps) => {
	const { t } = useTranslation();
	const hasError = !!entry.error;
	const isRunning = !entry.finishedAt;

	let status: 'running' | 'failed' | 'completed' = 'completed';
	let statusText = t('Completed');
	if (isRunning) {
		status = 'running';
		statusText = t('Running');
	} else if (hasError) {
		status = 'failed';
		statusText = t('Failed');
	}

	const duration = formatDuration(entry.startedAt, entry.finishedAt);

	return (
		<Card>
			<CardBody>
				<Box display='flex' flexDirection='column' flexGrow={1}>
					<Box display='flex' justifyContent='space-between' alignItems='flex-start' mbe='x4'>
						{entry.startedAt && (
							<Box fontScale='p2' color='default'>
								{formatDateAndTime(entry.startedAt)}
							</Box>
						)}
						<Tag variant={statusVariant(status)}>{statusText}</Tag>
					</Box>

					{duration && (
						<Box fontScale='c1' color='hint' mbe={hasError ? 'x8' : 'none'}>
							{t('Duration')}: {duration}
						</Box>
					)}

					{hasError && (
						<Box withRichContent w='full' mbs='x8'>
							<pre>
								<code>{typeof entry.error === 'object' ? JSON.stringify(entry.error, null, 2) : String(entry.error)}</code>
							</pre>
						</Box>
					)}
				</Box>
			</CardBody>
		</Card>
	);
};

export default BackgroundJobHistoryCard;
