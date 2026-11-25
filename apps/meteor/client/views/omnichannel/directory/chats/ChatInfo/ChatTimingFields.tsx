import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { InfoPanelField, InfoPanelLabel, InfoPanelText, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useFormatDuration } from './useFormatDuration';

type ChatTimingFieldsProps = Partial<Pick<Serialized<IOmnichannelRoom>, 'ts' | 'closedAt' | 'servedBy' | 'metrics'>>;

const ChatTimingFields = ({ ts, closedAt, servedBy, metrics }: ChatTimingFieldsProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const formatDuration = useFormatDuration();

	return (
		<>
			{closedAt && ts && (
				<InfoPanelField>
					<InfoPanelLabel>{t('Chat_Duration')}</InfoPanelLabel>
					<InfoPanelText>{formatDuration((new Date(closedAt).getTime() - new Date(ts).getTime()) / 1000)}</InfoPanelText>
				</InfoPanelField>
			)}
			{ts && (
				<InfoPanelField>
					<InfoPanelLabel>{t('Created_at')}</InfoPanelLabel>
					<InfoPanelText>{formatDateAndTime(ts)}</InfoPanelText>
				</InfoPanelField>
			)}
			{closedAt && (
				<InfoPanelField>
					<InfoPanelLabel>{t('Closed_At')}</InfoPanelLabel>
					<InfoPanelText>{formatDateAndTime(closedAt)}</InfoPanelText>
				</InfoPanelField>
			)}
			{servedBy?.ts && (
				<InfoPanelField>
					<InfoPanelLabel>{t('Taken_at')}</InfoPanelLabel>
					<InfoPanelText>{formatDateAndTime(servedBy.ts)}</InfoPanelText>
				</InfoPanelField>
			)}
			{metrics?.response?.avg && formatDuration(metrics.response.avg) && (
				<InfoPanelField>
					<InfoPanelLabel>{t('Avg_response_time')}</InfoPanelLabel>
					<InfoPanelText>{formatDuration(metrics.response.avg)}</InfoPanelText>
				</InfoPanelField>
			)}
		</>
	);
};

export default ChatTimingFields;
