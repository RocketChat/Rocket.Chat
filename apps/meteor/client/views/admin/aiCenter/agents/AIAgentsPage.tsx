import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import {
	Box,
	Button,
	ButtonGroup,
	Callout,
	CheckBox,
	Field,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	Select,
	TextAreaInput,
	TextInput,
} from '@rocket.chat/fuselage';
import type { AiAgentSummary, AiEngineSeatCounts } from '@rocket.chat/rest-typings';
import { Page, PageHeader, PageScrollableContentWithShadow, PageSkeleton, useHasLicenseModule } from '@rocket.chat/ui-client';
import { usePermission, useRouter, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AgentsListSection from './AgentsListSection';
import EnginesSummarySection from './EnginesSummarySection';
import { useExperimentalEndpoint } from '../../../../hooks/useExperimentalEndpoint';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const AI_AGENTS_QUERY_KEY = ['ai-center', 'agents', 'list'] as const;

const AIAgentsPage = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const { data: hasAILicense, isPending: isLicensePending } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canManageAiAgents = usePermission('manage-ai-agents');
	const agentsEnabled = useSetting('AI_Agents_Enabled', false);

	const listAgentsEndpoint = useExperimentalEndpoint('GET', '/experimental/ai-agents.list');
	const createAgentEndpoint = useExperimentalEndpoint('POST', '/experimental/ai-agents.create');
	const retryAgentEndpoint = useExperimentalEndpoint('POST', '/experimental/ai-agents.retry');
	const disableAgentEndpoint = useExperimentalEndpoint('POST', '/experimental/ai-agents.disable');

	const canQueryAgents = hasAILicense === true && canManageAiAgents && agentsEnabled === true;

	const {
		data,
		isPending: isListPending,
		isError,
	} = useQuery({
		queryKey: AI_AGENTS_QUERY_KEY,
		queryFn: () => listAgentsEndpoint(undefined as never),
		enabled: canQueryAgents,
	});

	const engines: AiEngineSeatCounts[] = useMemo(() => data?.engines ?? [], [data?.engines]);
	const agents: AiAgentSummary[] = useMemo(() => data?.agents ?? [], [data?.agents]);

	const [selectedEngineId, setSelectedEngineId] = useState<string>('');
	const [retryTarget, setRetryTarget] = useState<AiAgentSummary | null>(null);
	const [name, setName] = useState('');
	const [instructions, setInstructions] = useState('');
	const [selectedRoute, setSelectedRoute] = useState('');
	const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
	const [selectedTools, setSelectedTools] = useState<string[]>([]);

	const activeEngine = useMemo(
		() => engines.find((engine) => engine.engineId === (retryTarget?.engineId ?? selectedEngineId)) ?? engines[0],
		[engines, retryTarget?.engineId, selectedEngineId],
	);

	useEffect(() => {
		if (!selectedEngineId && engines.length > 0) {
			setSelectedEngineId(engines[0].engineId);
		}
	}, [engines, selectedEngineId]);

	useEffect(() => {
		if (activeEngine && !selectedRoute && activeEngine.allowedRoutes.length > 0) {
			setSelectedRoute(activeEngine.allowedRoutes[0]);
		}
	}, [activeEngine, selectedRoute]);

	const resetForm = () => {
		setRetryTarget(null);
		setName('');
		setInstructions('');
		setSelectedRooms([]);
		setSelectedTools([]);
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (retryTarget) {
				return retryAgentEndpoint({
					agentId: retryTarget._id,
					name,
					instructions,
					rooms: selectedRooms,
					tools: selectedTools,
					modelRoute: selectedRoute,
				});
			}
			if (!activeEngine) {
				throw new Error('No engine selected');
			}
			return createAgentEndpoint({
				engineId: activeEngine.engineId,
				name,
				instructions,
				rooms: selectedRooms,
				tools: selectedTools,
				modelRoute: selectedRoute,
			});
		},
		onSuccess: () => {
			resetForm();
			void queryClient.invalidateQueries({ queryKey: AI_AGENTS_QUERY_KEY });
			dispatchToastMessage({
				type: 'success',
				message: retryTarget ? t('AI_Agents_retry_success') : t('AI_Agents_create_success'),
			});
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const disableMutation = useMutation({
		mutationFn: (agentId: string) => disableAgentEndpoint({ agentId }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: AI_AGENTS_QUERY_KEY });
			dispatchToastMessage({ type: 'success', message: t('AI_Agents_disable_success') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const toggleRoom = (roomId: string) => {
		setSelectedRooms((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]));
	};

	const toggleTool = (toolId: string) => {
		setSelectedTools((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]));
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		saveMutation.mutate();
	};

	const subscriptionHref = router.buildRoutePath({ name: 'subscription' });

	if (isLicensePending) {
		return <PageSkeleton />;
	}

	if (hasAILicense === false) {
		return (
			<Page background='tint'>
				<PageHeader title={t('AI_Agents')} onClickBack={() => router.navigate('/admin/ai-center')} />
				<PageScrollableContentWithShadow padding={24}>
					<Callout type='info' icon='stars' title={t('AI_Center_license_required_title')}>
						<Box>{t('AI_Center_license_required_description')}</Box>
						<Box paddingBlockStart={12}>
							<Button is='a' href={subscriptionHref} size='small'>
								{t('View_options')}
							</Button>
						</Box>
					</Callout>
				</PageScrollableContentWithShadow>
			</Page>
		);
	}

	if (!canManageAiAgents) {
		return <NotAuthorizedPage />;
	}

	if (agentsEnabled !== true) {
		return (
			<Page background='tint'>
				<PageHeader title={t('AI_Agents')} onClickBack={() => router.navigate('/admin/ai-center')} />
				<PageScrollableContentWithShadow padding={24}>
					<Callout type='info' title={t('AI_Agents_disabled_title')}>
						{t('AI_Agents_disabled_description')}
					</Callout>
				</PageScrollableContentWithShadow>
			</Page>
		);
	}

	const canSubmitCreate =
		Boolean(activeEngine) &&
		!activeEngine.reportStale &&
		(Boolean(retryTarget) || activeEngine.available > 0) &&
		name.trim().length > 0 &&
		instructions.trim().length > 0 &&
		selectedRooms.length > 0 &&
		selectedRoute.length > 0 &&
		!saveMutation.isPending;

	return (
		<Page background='tint'>
			<PageHeader title={t('AI_Agents')} onClickBack={() => router.navigate('/admin/ai-center')} />
			<PageScrollableContentWithShadow padding={24}>
				<Box display='flex' flexDirection='column' gap={24} marginInline='auto' width='full'>
					{isError && (
						<Callout type='danger' title={t('Error')}>
							{t('AI_Agents_load_error')}
						</Callout>
					)}

					<Box>
						<Box is='h2' fontScale='h3' marginBlockEnd={12}>
							{t('AI_Agents_engines_heading')}
						</Box>
						<EnginesSummarySection engines={engines} isPending={isListPending} />
					</Box>

					<Box is='form' onSubmit={handleSubmit}>
						<Box is='h2' fontScale='h3' marginBlockEnd={12}>
							{retryTarget ? t('AI_Agents_retry_heading', { seatId: retryTarget.seatId }) : t('AI_Agents_create_heading')}
						</Box>
						{activeEngine?.reportStale && (
							<Box marginBlockEnd={12}>
								<Callout type='warning' title={t('AI_Agents_report_stale_title')}>
									{t('AI_Agents_report_stale_description')}
								</Callout>
							</Box>
						)}
						<FieldGroup>
							{!retryTarget && engines.length > 0 && (
								<Field>
									<FieldLabel>{t('AI_Agents_engine_label')}</FieldLabel>
									<FieldRow>
										<Select
											aria-label={t('AI_Agents_engine_label')}
											value={activeEngine?.engineId ?? ''}
											onChange={(value) => {
												const nextId = String(value);
												setSelectedEngineId(nextId);
												setSelectedRooms([]);
												setSelectedTools([]);
												const nextEngine = engines.find((e) => e.engineId === nextId);
												setSelectedRoute(nextEngine?.allowedRoutes[0] ?? '');
											}}
											options={engines.map((engine) => [engine.engineId, engine.engineName])}
										/>
									</FieldRow>
								</Field>
							)}
							<Field>
								<FieldLabel>{t('Name')}</FieldLabel>
								<FieldRow>
									<TextInput
										aria-label={t('Name')}
										value={name}
										onChange={(e) => setName((e.target as HTMLInputElement).value)}
										maxLength={64}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('AI_Agents_instructions_label')}</FieldLabel>
								<FieldRow>
									<TextAreaInput
										aria-label={t('AI_Agents_instructions_label')}
										rows={4}
										value={instructions}
										onChange={(e) => setInstructions(e.target.value)}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('AI_Agents_model_route_label')}</FieldLabel>
								<FieldRow>
									<Select
										aria-label={t('AI_Agents_model_route_label')}
										value={selectedRoute}
										onChange={(value) => setSelectedRoute(String(value))}
										options={(activeEngine?.allowedRoutes ?? []).map((route) => [route, route])}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('AI_Agents_tools_label')}</FieldLabel>
								<Box display='flex' flexDirection='column' gap={8}>
									{(activeEngine?.allowedTools ?? []).map((tool) => (
										<Box key={tool} display='flex' alignItems='center' gap={8}>
											<CheckBox checked={selectedTools.includes(tool)} onChange={() => toggleTool(tool)} />
											<span>{tool}</span>
										</Box>
									))}
								</Box>
							</Field>
							<Field>
								<FieldLabel>{t('AI_Agents_rooms_label')}</FieldLabel>
								<FieldHint>{t('AI_Agents_room_flags_checked_on_register')}</FieldHint>
								<Box display='flex' flexDirection='column' gap={8} paddingBlockStart={8}>
									{(activeEngine?.eligibleRooms ?? []).length === 0 ? (
										<Box>{t('AI_Agents_no_eligible_rooms')}</Box>
									) : (
										(activeEngine?.eligibleRooms ?? []).map((room) => (
											<Box key={room._id} display='flex' alignItems='center' gap={8}>
												<CheckBox checked={selectedRooms.includes(room._id)} onChange={() => toggleRoom(room._id)} />
												<span>#{room.fname ?? room.name}</span>
											</Box>
										))
									)}
								</Box>
							</Field>
							<ButtonGroup>
								<Button variant='primary' type='submit' disabled={!canSubmitCreate}>
									{retryTarget ? t('AI_Agents_retry_action') : t('AI_Agents_create_action')}
								</Button>
								{retryTarget && (
									<Button variant='secondary' onClick={resetForm}>
										{t('Cancel')}
									</Button>
								)}
							</ButtonGroup>
						</FieldGroup>
					</Box>

					<Box>
						<Box is='h2' fontScale='h3' marginBlockEnd={12}>
							{t('AI_Agents_list_heading')}
						</Box>
						<AgentsListSection
							agents={agents}
							isDisabling={disableMutation.isPending}
							onRetry={(agent) => {
								setRetryTarget(agent);
								setName(agent.name ?? '');
								setSelectedRooms(agent.rooms);
								setSelectedTools(agent.tools);
								if (agent.modelRoute) {
									setSelectedRoute(agent.modelRoute);
								}
							}}
							onDisable={(agentId) => disableMutation.mutate(agentId)}
						/>
					</Box>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AIAgentsPage;
