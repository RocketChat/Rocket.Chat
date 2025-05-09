import { Skeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import AuditModalField from './AuditModalField';
import AuditModalLabel from './AuditModalLabel';
import AuditModalText from './AuditModalText';

type AppInfoFieldProps = {
	appId: string;
};

// This is a separate component to encapsulate its logic and in the future expand it to a field that shows more info on the App
export const AppInfoField = ({ appId }: AppInfoFieldProps) => {
	const t = useTranslation();

	const getAppInfo = useEndpoint('GET', `/apps/:id`, { id: appId });

	const { data, isLoading, isSuccess } = useQuery({
		queryKey: ['getAppInfo', appId],

		queryFn: async () => {
			return getAppInfo();
		},
	});

	return (
		<>
			<AuditModalField>
				<AuditModalLabel>{t('Actor')}</AuditModalLabel>
				<AuditModalText>{t('App')}</AuditModalText>
			</AuditModalField>
			<AuditModalField>
				<AuditModalLabel>{isSuccess && data ? t('App_name') : t('App_id')}</AuditModalLabel>
				{isLoading && <Skeleton />}
				{isSuccess && data ? <AuditModalText>{data.app.name}</AuditModalText> : <AuditModalText>{appId}</AuditModalText>}
			</AuditModalField>
		</>
	);
};
