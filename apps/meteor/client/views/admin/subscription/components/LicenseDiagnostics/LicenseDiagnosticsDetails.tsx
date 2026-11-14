import type { LicenseDiagnosticsCandidate } from '@rocket.chat/core-typings';
import { Grid, Icon, Tag, Text } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { formatServerUrl, getLeadCandidate, shortenHash, sourceLabels } from './getDiagnosticsState';
import type { LicenseDiagnosticsResult } from './getDiagnosticsState';
import DiagnosticsField from './layout/DiagnosticsField';
import { useFormatDate } from '../../../../../hooks/useFormatDate';

const getCandidateStatus = (candidate: LicenseDiagnosticsCandidate): TranslationKey => {
	if (!candidate.decoded) {
		return 'License_error_format_invalid';
	}

	return candidate.valid ? 'Valid_license' : 'Invalid_license';
};

type LicenseDiagnosticsDetailsProps = {
	diagnostics: LicenseDiagnosticsResult;
	activeModules?: string[];
};

const LicenseDiagnosticsDetails = ({ diagnostics, activeModules = [] }: LicenseDiagnosticsDetailsProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const { workspace, candidates, cloud } = diagnostics;
	const lead = getLeadCandidate(diagnostics);
	const others = candidates.filter((candidate) => candidate !== lead);

	return (
		<Grid>
			<DiagnosticsField
				label={t('License_diagnostics_workspace_address')}
				hint={t('License_diagnostics_from_site_url', { siteUrl: workspace.siteUrl })}
			>
				<Text>{workspace.normalizedUrl ?? '…'}</Text>
			</DiagnosticsField>
			{lead?.decoded &&
				lead.serverUrls.map((serverUrl, index) => (
					<DiagnosticsField key={index} label={t('License_diagnostics_bound_to')}>
						<Text title={serverUrl.value}>{formatServerUrl(serverUrl)}</Text>
						<Tag variant={serverUrl.matches ? undefined : 'danger'} icon={<Icon size='x12' name={serverUrl.matches ? 'check' : 'cross'} />}>
							{t(serverUrl.matches ? 'License_diagnostics_matches' : 'License_diagnostics_does_not_match')}
						</Tag>
					</DiagnosticsField>
				))}
			<DiagnosticsField label={t('License_diagnostics_hashed_address')}>
				<Text title={workspace.urlHash}>{workspace.urlHash ? shortenHash(workspace.urlHash) : '…'}</Text>
			</DiagnosticsField>
			{lead && (
				<DiagnosticsField
					label={t('License_diagnostics_license_source')}
					hint={t('License_diagnostics_token_tail', { tokenTail: lead.tokenTail })}
				>
					<Text>{lead.sources.map((source) => t(sourceLabels[source])).join(', ')}</Text>
					{!lead.decoded && (
						<Tag variant='danger' icon={<Icon size='x12' name='cross' />}>
							{t('License_error_format_invalid')}
						</Tag>
					)}
				</DiagnosticsField>
			)}
			{lead?.decoded &&
				lead.validPeriods.map(({ validFrom, validUntil, inRange }, index) => (
					<DiagnosticsField key={index} label={t('License_diagnostics_valid_period')}>
						<Text>
							{t('License_diagnostics_period', {
								from: validFrom ? formatDate(validFrom) : '…',
								until: validUntil ? formatDate(validUntil) : '…',
							})}
						</Text>
						{!inRange && (
							<Tag variant='danger' icon={<Icon size='x12' name='cross' />}>
								{t('License_diagnostics_out_of_range')}
							</Tag>
						)}
					</DiagnosticsField>
				))}
			{lead?.decoded && (
				<DiagnosticsField
					label={t('License_diagnostics_license_type')}
					hint={cloud && t(cloud.registered ? 'License_diagnostics_registered' : 'License_diagnostics_not_registered')}
				>
					<Text>
						{[
							...lead.tags.map(({ name }) => name),
							t(lead.offline ? 'License_diagnostics_type_offline' : 'License_diagnostics_type_online'),
						].join(' · ')}
					</Text>
				</DiagnosticsField>
			)}
			{activeModules.length > 0 && (
				<DiagnosticsField label={t('License_diagnostics_enabled_modules')}>
					<Text>{activeModules.join(', ')}</Text>
				</DiagnosticsField>
			)}
			{lead?.decoded && lead.behaviors.length > 0 && (
				<DiagnosticsField label={t('License_diagnostics_reasons')}>
					<Text>{[...new Set(lead.behaviors.map(({ behavior, reason }) => `${behavior}/${reason}`))].join(', ')}</Text>
				</DiagnosticsField>
			)}
			{others.map((candidate) => (
				<DiagnosticsField
					key={candidate.tokenTail}
					label={t('License_diagnostics_other_license')}
					hint={t('License_diagnostics_token_tail', { tokenTail: candidate.tokenTail })}
				>
					<Text>{candidate.sources.map((source) => t(sourceLabels[source])).join(', ')}</Text>
					<Tag
						variant={candidate.decoded && candidate.valid ? undefined : 'danger'}
						icon={<Icon size='x12' name={candidate.decoded && candidate.valid ? 'check' : 'cross'} />}
					>
						{t(getCandidateStatus(candidate))}
					</Tag>
					{candidate.loaded && <Tag>{t('License_diagnostics_loaded')}</Tag>}
				</DiagnosticsField>
			))}
		</Grid>
	);
};

export default LicenseDiagnosticsDetails;
