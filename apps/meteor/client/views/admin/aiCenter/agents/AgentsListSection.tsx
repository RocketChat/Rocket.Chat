import { Box, Button, ButtonGroup, Table, TableBody, TableCell, TableHead, TableRow, Tag } from '@rocket.chat/fuselage';
import type { AiAgentReadinessState, AiAgentSummary } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const readinessTagVariant = (readiness: AiAgentReadinessState): 'primary' | 'secondary' | 'warning' | 'danger' | undefined => {
	switch (readiness) {
		case 'ready':
			return 'primary';
		case 'engine ready, app not proved':
		case 'published, waiting for engine':
			return 'warning';
		case 'incomplete':
		case 'retired':
		case 'bot-invalid':
		case 'room-invalid':
			return 'danger';
		case 'disabled':
		default:
			return undefined;
	}
};

type AgentsListSectionProps = {
	agents: AiAgentSummary[];
	isDisabling: boolean;
	onRetry: (agent: AiAgentSummary) => void;
	onDisable: (agentId: string) => void;
};

const AgentsListSection = ({ agents, isDisabling, onRetry, onDisable }: AgentsListSectionProps): ReactElement => {
	const { t } = useTranslation();

	if (agents.length === 0) {
		return <Box>{t('AI_Agents_empty_list')}</Box>;
	}

	return (
		<Table>
			<TableHead>
				<TableRow>
					<TableCell>{t('Name')}</TableCell>
					<TableCell>{t('AI_Agents_seat_column')}</TableCell>
					<TableCell>{t('Status')}</TableCell>
					<TableCell>{t('AI_Agents_last_report')}</TableCell>
					<TableCell>{t('Actions')}</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{agents.map((agent) => (
					<TableRow key={agent._id}>
						<TableCell>{agent.name ?? agent.seatId}</TableCell>
						<TableCell>
							{agent.seatId} ({agent.seatState})
						</TableCell>
						<TableCell>
							{agent.readiness === 'disabled' ? (
								<>
									<Tag>{t('Disabled')}</Tag>
									<Box marginInlineStart={8} display='inline-block'>
										{agent.engineConfirmed ? (
											<Tag>{t('AI_Agents_disable_confirmed')}</Tag>
										) : (
											<Tag variant='warning'>{t('AI_Agents_disable_pending_engine')}</Tag>
										)}
									</Box>
								</>
							) : (
								<Tag variant={readinessTagVariant(agent.readiness)}>{agent.readiness}</Tag>
							)}
							{agent.disagreement && (
								<Box marginInlineStart={8} display='inline-block'>
									<Tag variant='danger'>{t('AI_Agents_engine_disagrees')}</Tag>
								</Box>
							)}
						</TableCell>
						<TableCell>{agent.lastReportAt ?? t('AI_Agents_no_report')}</TableCell>
						<TableCell>
							<ButtonGroup>
								{agent.readiness === 'incomplete' && agent.seatState === 'claimed' && (
									<Button size='small' onClick={() => onRetry(agent)}>
										{t('AI_Agents_retry_action')}
									</Button>
								)}
								{agent.status === 'published' && agent.seatState !== 'retired' && (
									<Button size='small' variant='danger' disabled={isDisabling} onClick={() => onDisable(agent._id)}>
										{t('Disable')}
									</Button>
								)}
							</ButtonGroup>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default AgentsListSection;
