import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useOmnichannelSourceName = () => {
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

	return getSourceName;
};
