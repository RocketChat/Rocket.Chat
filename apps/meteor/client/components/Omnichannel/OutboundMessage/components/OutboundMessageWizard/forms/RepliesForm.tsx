import type { Serialized, ILivechatDepartment, ILivechatAgent } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { omnichannelQueryKeys } from '../../../../../../lib/queryKeys';
import AutoCompleteDepartment from '../../../../../AutoCompleteDepartment';
import AutoCompleteAgent from '../../AutoCompleteDepartmentAgent';
import RetryButton from '../components/RetryButton';
import { useFormKeyboardSubmit } from '../hooks/useFormKeyboardSubmit';
import { cxp } from '../utils/cx';
import { FormFetchError } from '../utils/errors';

export type RepliesFormData = {
	departmentId: string;
	agentId: string;
};

export type RepliesFormSubmitPayload = {
	departmentId?: string;
	department?: Serialized<ILivechatDepartment>;
	agentId?: string;
	agent?: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat' | 'phone'>;
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
	const { t } = useTranslation();
	const repliesFormId = useId();
	const {
		control,
		formState: { errors, isSubmitting },
		trigger,
		clearErrors,
		handleSubmit,
	} = useForm<RepliesFormData>({ defaultValues });

	const customActions = useMemo(() => renderActions?.({ isSubmitting }), [isSubmitting, renderActions]);

	const [departmentId, agentId] = useWatch({ control, name: ['departmentId', 'agentId'] });

	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: departmentId ?? '' });
	const getAgent = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: agentId ?? '' });

	const {
		data: { department, agents } = {},
		isError: isErrorDepartment,
		isFetching: isFetchingDepartment,
		refetch: refetchDepartment,
	} = useQuery({
		queryKey: omnichannelQueryKeys.department(departmentId),
		queryFn: () => getDepartment({ onlyMyDepartments: 'true' }),
		enabled: !!departmentId,
	});

	const {
		data: agent,
		isError: isErrorAgent,
		isFetching: isFetchingAgent,
		refetch: refetchAgent,
	} = useQuery({
		queryKey: omnichannelQueryKeys.agent(agentId),
		queryFn: () => getAgent(),
		enabled: !!agentId,
		select: (data) => data.user,
	});

	useEffect(() => {
		isErrorDepartment && trigger('departmentId');
		return () => clearErrors('departmentId');
	}, [clearErrors, isErrorDepartment, trigger]);

	useEffect(() => {
		isErrorAgent && trigger('agentId');
		return () => clearErrors('agentId');
	}, [clearErrors, isErrorAgent, trigger]);

	const submit = useEffectEvent(async ({ agentId, departmentId }: RepliesFormData) => {
		// Wait if department or agent is still being fetched in background
		const [updatedDepartment, updatedAgent] = await Promise.all([
			departmentId && isFetchingDepartment ? refetchDepartment().then((r) => r.data?.department) : Promise.resolve(department),
			agentId && isFetchingAgent ? refetchAgent().then((r) => r.data) : Promise.resolve(agent),
		]);

		if (departmentId && !updatedDepartment) {
			throw new FormFetchError('error-department-not-found');
		}

		if (agentId && !updatedAgent) {
			throw new FormFetchError('error-agent-not-found');
		}

		onSubmit({ departmentId, department: updatedDepartment, agentId, agent: updatedAgent });
	});

	const formRef = useFormKeyboardSubmit(() => handleSubmit(submit)(), [submit, handleSubmit]);

	return (
		<form ref={formRef} id={repliesFormId} onSubmit={handleSubmit(submit)} noValidate>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' id={`${repliesFormId}-department`}>{`${t('Department')} (${t('optional')})`}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='departmentId'
							rules={{
								validate: () => (isErrorDepartment ? t('Error_loading__name__information', { name: t('department') }) : true),
							}}
							render={({ field }) => (
								<AutoCompleteDepartment
									name={field.name}
									aria-invalid={!!errors.departmentId}
									aria-labelledby={`${repliesFormId}-department`}
									aria-describedby={cxp(repliesFormId, {
										'department-error': !!errors.departmentId,
										'department-hint': true,
									})}
									error={errors.departmentId?.message}
									placeholder={t('Select_department')}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.departmentId && (
						<FieldError aria-live='assertive' id={`${repliesFormId}-department-error`} display='flex' alignItems='center'>
							{errors.departmentId.message}
							{isErrorDepartment && <RetryButton loading={isFetchingDepartment} onClick={refetchDepartment} />}
						</FieldError>
					)}
					<FieldHint id={`${repliesFormId}-department-hint`}>{t('Outbound_message_department_hint')}</FieldHint>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${repliesFormId}-agent`}>{`${t('Agent')} (${t('optional')})`}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='agentId'
							rules={{
								validate: () => (isErrorAgent ? t('Error_loading__name__information', { name: t('agent') }) : true),
							}}
							render={({ field }) => (
								<AutoCompleteAgent
									name={field.name}
									aria-busy={isFetchingDepartment}
									aria-invalid={!!errors.agentId}
									aria-describedby={cxp(repliesFormId, {
										'agent-error': !!errors.agentId,
										'agent-hint': true,
									})}
									error={!!errors.agentId}
									id={`${repliesFormId}-agent`}
									agents={agents}
									placeholder={isFetchingDepartment ? t('Loading...') : t('Select_agent')}
									disabled={!departmentId}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.agentId && (
						<FieldError aria-live='assertive' id={`${repliesFormId}-agent-error`} display='flex' alignItems='center'>
							{errors.agentId.message}
							{isErrorAgent && <RetryButton loading={isFetchingAgent} onClick={refetchAgent} />}
						</FieldError>
					)}
					<FieldHint id={`${repliesFormId}-agent-hint`}>{t('Outbound_message_agent_hint')}</FieldHint>
				</Field>
			</FieldGroup>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end'>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</form>
	);
};

RepliesForm.displayName = 'RepliesForm';

export default RepliesForm;
