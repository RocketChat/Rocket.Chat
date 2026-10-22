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
			<Box>
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} marginBlockEnd={8} />
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
		<Box>
			{!hasCompliant && (
				<Box marginBlockEnd={16}>
					<Callout type='danger'>{t('ABAC_Preview_No_Compliant_Members')}</Callout>
				</Box>
			)}
			{hasCompliant && (nonCompliant.length > 0 || inconclusive.length > 0) && (
				<Box marginBlockEnd={16}>
					<Callout icon='info-circled'>{t('ABAC_Preview_Only_Compliant_Added')}</Callout>
				</Box>
			)}
			{hasCompliant && creator === 'nonCompliant' && (
				<Box marginBlockEnd={16}>
					<Callout type='warning'>{t('ABAC_Preview_Creator_Not_Added')}</Callout>
				</Box>
			)}
			{inconclusive.length > 0 && (
				<Box marginBlockEnd={16}>
					<Callout type='warning'>{t('ABAC_Preview_Inconclusive_Warning')}</Callout>
				</Box>
			)}
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Compliant')} members={compliant} verdict='compliant' />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Non_Compliant')} members={nonCompliant} verdict='nonCompliant' />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Inconclusive')} members={inconclusive} verdict='inconclusive' />
		</Box>
	);
};

export default AbacMembershipPreview;
