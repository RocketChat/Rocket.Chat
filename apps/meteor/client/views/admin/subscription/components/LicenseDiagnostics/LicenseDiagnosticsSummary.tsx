import { Button, Card, Icon, Stack, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { formatServerUrl, getLeadCandidate, sourceLabels } from './getDiagnosticsState';
import type { LicenseDiagnosticsResult } from './getDiagnosticsState';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

type LicenseDiagnosticsSummaryProps = {
	diagnostics: LicenseDiagnosticsResult;
	validUntil?: string;
	onShow: () => void;
};

const LicenseDiagnosticsSummary = ({ diagnostics, validUntil, onShow }: LicenseDiagnosticsSummaryProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const lead = getLeadCandidate(diagnostics);

	return (
		<Card>
			<Stack direction='row' align='center' gap={16} wrap>
				<Icon name='circle-check' color='status-font-on-success' />
				<Stack gap={4} grow>
					<Text is='h4' fontScale='h5'>
						{validUntil ? t('License_diagnostics_valid_until_summary', { date: formatDate(validUntil) }) : t('Valid_license')}
					</Text>
					{lead?.decoded && (
						<Text fontScale='c1' color='hint'>
							{[
								...lead.tags.map(({ name }) => name),
								...lead.serverUrls.map((serverUrl) => t('License_diagnostics_bound_to_address', { address: formatServerUrl(serverUrl) })),
								...lead.sources.map((source) => t(sourceLabels[source])),
							].join(' · ')}
						</Text>
					)}
				</Stack>
				<Button icon='chevron-down' aria-expanded={false} onClick={onShow}>
					{t('License_diagnostics_show')}
				</Button>
			</Stack>
		</Card>
	);
};

export default LicenseDiagnosticsSummary;
