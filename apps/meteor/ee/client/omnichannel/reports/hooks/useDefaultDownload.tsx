import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { Period } from '../../../components/dashboards/periods';
import { formatAttachmentName } from '../utils/formatAttachmentName';
import { formatPeriodRange } from '../utils/formatPeriodRange';

type DefaultDownloadHookProps = {
	columnName: string;
	title: string;
	period: Period['key'];
	data: { rawLabel?: string; label: string; value: number }[];
};

export const useDefaultDownload = ({ columnName, title, period, data }: DefaultDownloadHookProps) => {
	const t = useTranslation();
	return useMemo(() => {
		const { start, end } = formatPeriodRange(period);

		return {
			attachmentName: formatAttachmentName(title, start, end),
			headers: [t('From'), t('To'), columnName, t('Total')],
			dataAvailable: data.length > 0,
			dataExtractor() {
				return data?.map(({ label, rawLabel, value }) => [start, end, rawLabel || label, value]);
			},
		};
	}, [columnName, data, period, t, title]);
};
