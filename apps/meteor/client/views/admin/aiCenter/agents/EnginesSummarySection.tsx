import { Box, Callout, Table, TableBody, TableCell, TableHead, TableRow, Tag } from '@rocket.chat/fuselage';
import type { AiEngineSeatCounts } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type EnginesSummarySectionProps = {
	engines: AiEngineSeatCounts[];
	isPending: boolean;
};

const EnginesSummarySection = ({ engines, isPending }: EnginesSummarySectionProps): ReactElement => {
	const { t } = useTranslation();

	if (isPending) {
		return <Box>{t('Loading')}</Box>;
	}

	if (engines.length === 0) {
		return (
			<Callout type='info' title={t('AI_Agents_no_engines_title')}>
				{t('AI_Agents_no_engines_description')}
			</Callout>
		);
	}

	return (
		<Table>
			<TableHead>
				<TableRow>
					<TableCell>{t('Name')}</TableCell>
					<TableCell>{t('AI_Agents_seats_available')}</TableCell>
					<TableCell>{t('AI_Agents_seats_claimed')}</TableCell>
					<TableCell>{t('AI_Agents_seats_retired')}</TableCell>
					<TableCell>{t('AI_Agents_last_report')}</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{engines.map((engine) => (
					<TableRow key={engine.engineId}>
						<TableCell>{engine.engineName}</TableCell>
						<TableCell>
							{engine.available} / {engine.registered}
						</TableCell>
						<TableCell>{engine.claimed}</TableCell>
						<TableCell>{engine.retired}</TableCell>
						<TableCell>
							{engine.lastReportAt ?? t('AI_Agents_no_report')}
							{engine.reportStale && (
								<Box marginInlineStart={8} display='inline-block'>
									<Tag variant='warning'>{t('AI_Agents_report_stale')}</Tag>
								</Box>
							)}
							{engine.disagreed > 0 && (
								<Box marginInlineStart={8} display='inline-block'>
									<Tag variant='danger'>{t('AI_Agents_engine_disagrees')}</Tag>
								</Box>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default EnginesSummarySection;
