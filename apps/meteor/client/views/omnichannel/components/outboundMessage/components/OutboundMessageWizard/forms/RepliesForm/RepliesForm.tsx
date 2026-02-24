import type { Serialized, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup, Scrollable } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { useEndpoint, usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useId, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AgentField from './components/AgentField';
import DepartmentField from './components/DepartmentField';
import { useAllowedAgents } from './hooks/useAllowedAgents';
import { omnichannelQueryKeys } from '../../../../../../../../lib/queryKeys';
import Form from '../../components/OutboundMessageForm';
import { FormFetchError } from '../../utils/errors';

export type RepliesFormData = {
	departmentId: string;
	agentId: string;
};

export type RepliesFormSubmitPayload = {
	departmentId?: string;
	department?: Serialized<ILivechatDepartment>;
	agentId?: string;
	agent?: Serialized<ILivechatDepartmentAgents>;
};

export type RepliesFormRef = {
	submit: () => Promise<RepliesFormSubmitPayload>;
};

type RepliesFormProps = {
	defaultValues?: Partial<RepliesFormData>;
	renderActions?(props: { isSubmitting: boolean }): ReactNode;
	onSubmit: (data: RepliesFormSubmitPayload) => void;
};

const RepliesForm = (props: RepliesFormProps) => {
	const { defaultValues, renderActions, onSubmit } = props;
	const dispatchToastMessage = useToastBarDispatch();
	const { t } = useTranslation();
	const repliesFormId = useId();
	const user = useUser();

	const canAssignAllDepartments = usePermission('outbound.can-assign-queues');
	const canAssignSelfOnlyAgent = usePermission('outbound.can-assign-self-only');
	const canAssignAnyAgent = usePermission('outbound.can-assign-any-agent');

	const {
		control,
		formState: { isSubmitting },
		trigger,
		clearErrors,
		handleSubmit,
		setValue,
	} = useForm<RepliesFormData>({ defaultValues });

	const customActions = useMemo(() => renderActions?.({ isSubmitting }), [isSubmitting, renderActions]);

	const departmentId = useWatch({ control, name: 'departmentId' });

	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: departmentId ?? '' });

	const {
		data: { department, agents: queryAgents = [] } = {},
		isError: isErrorDepartment,
		isFetching: isFetchingDepartment,
		refetch: refetchDepartment,
	} = useQuery({
		queryKey: omnichannelQueryKeys.department(departmentId),
		queryFn: () => getDepartment({ onlyMyDepartments: !canAssignAllDepartments ? 'true' : 'false' }),
		enabled: !!departmentId,
	});

	const agents = useAllowedAgents({
		user,
		queryAgents,
		departmentId: department?._id,
		canAssignSelfOnlyAgent,
		canAssignAnyAgent,
	});

	useEffect(() => {
		isErrorDepartment && trigger('departmentId');
		return () => clearErrors('departmentId');
	}, [clearErrors, isErrorDepartment, trigger]);

	const submit = useEffectEvent(async ({ agentId, departmentId }: RepliesFormData) => {
		try {
			const agent = agents?.find((agent) => agent.agentId === agentId);

			// Wait if department or agent is still being fetched in background
			const updatedDepartment =
				departmentId && isFetchingDepartment ? await refetchDepartment().then((r) => r.data?.department) : department;

			if (departmentId && !updatedDepartment) {
				throw new FormFetchError('error-department-not-found');
			}

			if (agentId && !agent) {
				throw new FormFetchError('error-agent-not-found');
			}

			onSubmit({ departmentId, department: updatedDepartment, agentId, agent });
		} catch (error) {
			if (error instanceof FormFetchError) {
				trigger();
				return;
			}

			dispatchToastMessage({ type: 'error', message: t('Something_went_wrong') });
		}
	});

	return (
		<Form id={repliesFormId} onSubmit={handleSubmit(submit)} noValidate>
			<Scrollable vertical>
				<FieldGroup justifyContent='start' pi={2}>
					<DepartmentField
						control={control}
						onlyMyDepartments={!canAssignAllDepartments}
						isError={isErrorDepartment}
						isFetching={isFetchingDepartment}
						onRefetch={refetchDepartment}
						onChange={() => setValue('agentId', '')}
					/>

					<AgentField
						control={control}
						agents={agents}
						canAssignAgent={canAssignAnyAgent || canAssignSelfOnlyAgent}
						disabled={!departmentId}
						isLoading={isFetchingDepartment}
					/>
				</FieldGroup>
			</Scrollable>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end'>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</Form>
	);
};

RepliesForm.displayName = 'RepliesForm';

export default RepliesForm;
