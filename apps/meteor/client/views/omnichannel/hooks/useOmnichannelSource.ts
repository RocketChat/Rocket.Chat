import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useOmnichannelSource = () => {
	const { t } = useTranslation();

	const getSourceName = useCallback(
		(source: IOmnichannelSource, allowAlias = true) => {
			const roomSource = source.alias || source.id || source.type;

			const defaultTypesLabels: { [key: string]: string } = {
				widget: t('Livechat'),
				email: t('Email'),
				sms: t('SMS'),
				app: (allowAlias && source.alias) || t('Custom_APP'),
				api: (allowAlias && source.alias) || t('Custom_API'),
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
