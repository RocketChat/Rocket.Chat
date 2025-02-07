import { type ILivechatTrigger, type ILivechatTriggerAction, type Serialized } from '@rocket.chat/core-typings';
import { FieldGroup, Button, ButtonGroup, Field, FieldLabel, FieldRow, FieldError, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ConditionForm } from './ConditionForm';
import { ActionForm } from './actions/ActionForm';
import {
	ContextualbarScrollableContent,
	ContextualbarTitle,
	ContextualbarFooter,
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
} from '../../../components/Contextualbar';

export type TriggersPayload = {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	conditions: ILivechatTrigger['conditions'];
	actions: ILivechatTrigger['actions'];
};

const DEFAULT_SEND_MESSAGE_ACTION = {
	name: 'send-message',
	params: {
		sender: 'queue',
		name: '',
		msg: '',
	},
} as const;

const DEFAULT_PAGE_URL_CONDITION = { name: 'page-url', value: '' } as const;

export const getDefaultAction = (action: ILivechatTriggerAction): ILivechatTriggerAction => {
	switch (action.name) {
		case 'send-message':
			return {
				name: 'send-message',
				params: {
					name: action.params?.name || '',
					msg: action.params?.msg || '',
					sender: action.params?.sender || 'queue',
				},
			};
		case 'use-external-service':
			return {
				name: 'use-external-service',
				params: {
					name: action.params?.name || '',
					sender: action.params?.sender || 'queue',
					serviceUrl: action.params?.serviceUrl || '',
					serviceTimeout: action.params?.serviceTimeout || 0,
					serviceFallbackMessage: action.params?.serviceFallbackMessage || '',
				},
			};
	}
};

const getInitialValues = (triggerData: Serialized<ILivechatTrigger> | undefined): TriggersPayload => ({
	name: triggerData?.name ?? '',
	description: triggerData?.description || '',
	enabled: triggerData?.enabled ?? true,
	runOnce: !!triggerData?.runOnce || false,
	conditions: triggerData?.conditions.map(({ name, value }) => ({ name: name || 'page-url', value: value || '' })) ?? [
		DEFAULT_PAGE_URL_CONDITION,
	],
	actions: triggerData?.actions.map((action) => getDefaultAction(action)) ?? [DEFAULT_SEND_MESSAGE_ACTION],
});

const EditTrigger = ({ triggerData }: { triggerData?: Serialized<ILivechatTrigger> }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveTrigger = useEndpoint('POST', '/v1/livechat/triggers');
	const initValues = getInitialValues(triggerData);

	const formId = useId();
	const enabledField = useId();
	const runOnceField = useId();
	const nameField = useId();
	const descriptionField = useId();

	const {
		control,
		handleSubmit,
		trigger,
		formState: { isDirty, isSubmitting, errors },
	} = useForm<TriggersPayload>({ mode: 'onBlur', reValidateMode: 'onBlur', values: initValues });

	// Alternative way of checking isValid in order to not trigger validation on every render
	// https://github.com/react-hook-form/documentation/issues/944
	const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

	const { fields: conditionsFields } = useFieldArray({
		control,
		name: 'conditions',
	});

	const { fields: actionsFields } = useFieldArray({
		control,
		name: 'actions',
	});

	const saveTriggerMutation = useMutation({
		mutationFn: saveTrigger,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries({
				queryKey: ['livechat-getTriggersById'],
			});
			queryClient.invalidateQueries({
				queryKey: ['livechat-triggers'],
			});
			router.navigate('/omnichannel/triggers');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSave = async (data: TriggersPayload) => {
		return saveTriggerMutation.mutateAsync({
			...data,
			_id: triggerData?._id,
			actions: data.actions.map(getDefaultAction),
		});
	};

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>{triggerData?._id ? t('Edit_Trigger') : t('New_Trigger')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/triggers')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<form id={formId} onSubmit={handleSubmit(handleSave)}>
					<FieldGroup>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={enabledField}>{t('Enabled')}</FieldLabel>
								<Controller
									name='enabled'
									control={control}
									render={({ field: { value, ...field } }) => <ToggleSwitch id={enabledField} {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>

						<Field>
							<FieldRow>
								<FieldLabel htmlFor={runOnceField}>{t('Run_only_once_for_each_visitor')}</FieldLabel>
								<Controller
									name='runOnce'
									control={control}
									render={({ field: { value, ...field } }) => <ToggleSwitch id={runOnceField} {...field} checked={value} />}
								/>
							</FieldRow>
						</Field>

						<Field>
							<FieldLabel htmlFor={nameField} required>
								{t('Name')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									rules={{ required: t('Required_field', { field: t('Name') }) }}
									render={({ field }) => (
										<TextInput
											{...field}
											id={nameField}
											error={errors?.name?.message}
											aria-required={true}
											aria-invalid={Boolean(errors?.name)}
											aria-describedby={`${nameField}-error`}
										/>
									)}
								/>
							</FieldRow>
							{errors?.name && (
								<FieldError aria-live='assertive' id={`${nameField}-error`}>
									{errors?.name.message}
								</FieldError>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor={descriptionField}>{t('Description')}</FieldLabel>
							<FieldRow>
								<Controller name='description' control={control} render={({ field }) => <TextInput id={descriptionField} {...field} />} />
							</FieldRow>
						</Field>

						{conditionsFields.map((field, index) => (
							<ConditionForm key={field.id} control={control} index={index} />
						))}

						{actionsFields.map((field, index) => (
							<ActionForm key={field.id} control={control} trigger={trigger} index={index} />
						))}
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/omnichannel/triggers')}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' primary disabled={!isDirty || !isValid} loading={isSubmitting}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default EditTrigger;
