import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useOmnichannelSource = () => {
	const { t } = useTranslation();

	const getSourceName = useCallback(
		(source: IOmnichannelSource) => {
			const roomSource = source.alias || source.id || source.type;

			const defaultTypesLabels: { [key: string]: string } = {
				widget: t('Livechat'),
				email: t('Email'),
				sms: t('SMS'),
				app: source.alias || t('Custom_Integration'),
				api: source.alias || t('Custom_Integration'),
				other: t('Custom_Integration'),
			};

			return defaultTypesLabels[source.type] || roomSource;
		},
		[t],
	);

	const getSourceLabel = useCallback(
		(source: IOmnichannelSource) => {
			return source?.destination || source?.label || t('No_app_label_provided');
		},
		[t],
	);

	return { getSourceName, getSourceLabel };
};
