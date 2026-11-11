import { Callout, Card, CardBody, CardTitle, Divider, Icon, Stack, Tag } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LicenseDiagnosticsDetails from './LicenseDiagnosticsDetails';
import LicenseDiagnosticsSummary from './LicenseDiagnosticsSummary';
import LicenseDiagnosticsText from './LicenseDiagnosticsText';
import { getDiagnosticsState, getLatestValidUntil, getLeadCandidate } from './getDiagnosticsState';
import type { LicenseDiagnosticsResult } from './getDiagnosticsState';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

type LicenseDiagnosticsCardProps = {
	diagnostics: LicenseDiagnosticsResult;
	activeModules?: string[];
};

const LicenseDiagnosticsCard = ({ diagnostics, activeModules }: LicenseDiagnosticsCardProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const { tone, headline, fix } = getDiagnosticsState(diagnostics);
	const [showDetails, setShowDetails] = useState(false);
	const validUntil = getLatestValidUntil(getLeadCandidate(diagnostics));

	if (tone === 'success' && !showDetails) {
		return <LicenseDiagnosticsSummary diagnostics={diagnostics} validUntil={validUntil} onShow={() => setShowDetails(true)} />;
	}

	return (
		<Card>
			<Stack direction='row' justify='space-between' align='center' gap={12} wrap>
				<CardTitle variant='h4'>{t('License_diagnostics')}</CardTitle>
				{diagnostics.ready && diagnostics.status === 'valid' && (
					<Tag icon={<Icon size='x12' name='check' />}>
						{validUntil ? t('License_diagnostics_valid_until', { date: formatDate(validUntil) }) : t('Valid_license')}
					</Tag>
				)}
				{diagnostics.ready && diagnostics.status === 'invalid' && (
					<Tag variant='danger' icon={<Icon size='x12' name='cross' />}>
						{t(diagnostics.needsReapply ? 'License_diagnostics_not_applied' : 'Invalid_license')}
					</Tag>
				)}
			</Stack>
			<CardBody flexDirection='column'>
				<Stack gap={16}>
					<Callout type={tone} title={t(headline)}>
						{fix && t(fix)}
					</Callout>
					<LicenseDiagnosticsDetails diagnostics={diagnostics} activeModules={activeModules} />
					<Divider flush />
					<LicenseDiagnosticsText summaryText={diagnostics.summaryText} defaultExpanded={tone === 'danger'} />
				</Stack>
			</CardBody>
		</Card>
	);
};

export default LicenseDiagnosticsCard;
