import type { IAbacMembershipPreview } from '@rocket.chat/core-typings';
import { Box, Callout, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AbacPreviewMemberGroup from './AbacPreviewMemberGroup';
import AbacErrorCallout from '../AbacErrorCallout';

type AbacMembershipPreviewProps = {
	data?: IAbacMembershipPreview;
	isPending?: boolean;
	isError?: boolean;
	error?: unknown;
};

const AbacMembershipPreview = ({ data, isPending, isError, error }: AbacMembershipPreviewProps) => {
	const { t } = useTranslation();

	if (isPending) {
		return (
			<Box display='flex' flexDirection='column' gap={8} marginBlockEnd={8}>
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} />
				))}
			</Box>
		);
	}

	if (isError || !data) {
		return <AbacErrorCallout error={error} fallback='ABAC_Preview_Unavailable' />;
	}

	const { compliant, nonCompliant, inconclusive, creator } = data;
	const hasCompliant = compliant.length > 0;

	return (
		<Box display='flex' flexDirection='column' gap={16} marginBlockEnd={16}>
			{!hasCompliant && <Callout type='danger'>{t('ABAC_Preview_No_Compliant_Members')}</Callout>}
			{hasCompliant && (nonCompliant.length > 0 || inconclusive.length > 0) && (
				<Callout icon='info-circled'>{t('ABAC_Preview_Only_Compliant_Added')}</Callout>
			)}
			{hasCompliant && creator === 'nonCompliant' && <Callout type='warning'>{t('ABAC_Preview_Creator_Not_Added')}</Callout>}
			{inconclusive.length > 0 && <Callout type='warning'>{t('ABAC_Preview_Inconclusive_Warning')}</Callout>}
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Compliant')} members={compliant} verdict='compliant' />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Non_Compliant')} members={nonCompliant} verdict='nonCompliant' />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Inconclusive')} members={inconclusive} verdict='inconclusive' />
		</Box>
	);
};

export default AbacMembershipPreview;
