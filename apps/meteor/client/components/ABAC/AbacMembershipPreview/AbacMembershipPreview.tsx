import type { IAbacMembershipPreview } from '@rocket.chat/core-typings';
import { Box, Callout, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AbacPreviewMemberGroup from './AbacPreviewMemberGroup';

type AbacMembershipPreviewProps = {
	data?: IAbacMembershipPreview;
	isPending?: boolean;
	isError?: boolean;
};

const AbacMembershipPreview = ({ data, isPending, isError }: AbacMembershipPreviewProps) => {
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
		return <Callout type='danger'>{t('ABAC_Preview_Unavailable')}</Callout>;
	}

	const { compliant, nonCompliant, inconclusive, creator } = data;
	const hasCompliant = compliant.length > 0;

	return (
		<Box>
			{!hasCompliant && (
				<Callout type='danger' marginBlockEnd={16}>
					{t('ABAC_Preview_No_Compliant_Members')}
				</Callout>
			)}
			{hasCompliant && (nonCompliant.length > 0 || inconclusive.length > 0) && (
				<Callout icon='info-circled' marginBlockEnd={16}>
					{t('ABAC_Preview_Only_Compliant_Added')}
				</Callout>
			)}
			{hasCompliant && creator !== 'compliant' && (
				<Callout type='warning' marginBlockEnd={16}>
					{t('ABAC_Preview_Creator_Not_Added')}
				</Callout>
			)}
			{inconclusive.length > 0 && (
				<Callout type='warning' marginBlockEnd={16}>
					{t('ABAC_Preview_Inconclusive_Warning')}
				</Callout>
			)}
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Compliant')} members={compliant} compliant />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Non_Compliant')} members={nonCompliant} />
			<AbacPreviewMemberGroup title={t('ABAC_Preview_Inconclusive')} members={inconclusive} />
		</Box>
	);
};

export default AbacMembershipPreview;
