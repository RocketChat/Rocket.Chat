import type { ICronHistoryItem, Serialized } from '@rocket.chat/core-typings';
import { Box, Card, CardBody, Icon, Tag } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDuration, STATUS_LABEL, statusVariant } from './helpers';

export type BackgroundJobHistoryCardProps = {
	entry: Serialized<ICronHistoryItem>;
	formatDateAndTime: (date: string | Date) => string;
};

const BackgroundJobHistoryCard = ({ entry, formatDateAndTime }: BackgroundJobHistoryCardProps) => {
	const { t } = useTranslation();
	const hasError = !!entry.error;
	const isRunning = !entry.finishedAt;
	const [showError, setShowError] = useState(false);

	let status: 'running' | 'failed' | 'completed' = 'completed';
	if (isRunning) {
		status = 'running';
	} else if (hasError) {
		status = 'failed';
	}
	const statusText = t(STATUS_LABEL[status]);

	const duration = formatDuration(entry.startedAt, entry.finishedAt);

	return (
		<Box
			onClick={hasError ? () => setShowError((prev) => !prev) : undefined}
			onKeyDown={hasError ? (e) => (e.key === 'Enter' || e.key === ' ') && setShowError((prev) => !prev) : undefined}
			cursor={hasError ? 'pointer' : undefined}
			role={hasError ? 'button' : undefined}
			tabIndex={hasError ? 0 : undefined}
		>
			<Card>
				<CardBody>
					<Box display='flex' flexDirection='column' flexGrow={1}>
						<Box display='flex' justifyContent='space-between' alignItems='flex-start' marginBlockEnd={4}>
							{entry.startedAt && (
								<Box fontScale='p2' color='default'>
									{formatDateAndTime(entry.startedAt)}
								</Box>
							)}
							<Box display='flex' alignItems='center'>
								<Tag variant={statusVariant(status)}>{statusText}</Tag>
								{hasError && <Icon name={showError ? 'chevron-up' : 'chevron-down'} size='x20' color='hint' />}
							</Box>
						</Box>

						{duration && (
							<Box fontScale='c1' color='hint' marginBlockEnd={hasError && showError ? 8 : 0}>
								{t('Duration')}: {duration}
							</Box>
						)}

						{hasError && showError && (
							<Box withRichContent width='full' marginBlockStart={8}>
								<pre>
									<code>{typeof entry.error === 'object' ? JSON.stringify(entry.error, null, 2) : String(entry.error)}</code>
								</pre>
							</Box>
						)}
					</Box>
				</CardBody>
			</Card>
		</Box>
	);
};

export default BackgroundJobHistoryCard;
