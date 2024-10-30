import type { IOmnichannelSource } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

export const useOmnichannelSourceName = (source: IOmnichannelSource) => {
	const { t } = useTranslation();
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
};
