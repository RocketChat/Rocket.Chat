import type { ILivechatTrigger, ILivechatTriggerCondition, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldGroup,
	Button,
	ButtonGroup,
	Box,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	TextInput,
	ToggleSwitch,
	Select,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRouter, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import {
	ContextualbarScrollableContent,
	ContextualbarTitle,
	ContextualbarFooter,
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
} from '../../../components/Contextualbar';

const getInitialValues = (triggerData: Serialized<ILivechatTrigger> | undefined) => ({
	name: triggerData?.name || '',
	description: triggerData?.description || '',
	enabled: triggerData?.enabled || true,
	runOnce: !!triggerData?.runOnce || false,
	conditions: triggerData?.conditions.map(({ name, value }) => ({ name: name || 'page-url', value: value || '' })) || [
		{ name: 'page-url' as unknown as ILivechatTriggerCondition['name'], value: '' },
	],
	actions: triggerData?.actions.map(({ name, params }) => ({
		name: name || '',
		params: {
			sender: params?.sender || 'queue',
			msg: params?.msg || '',
			name: params?.name || '',
		},
	})) || [
		{
			name: 'send-message',
			params: {
				sender: 'queue',
				msg: '',
				name: '',
			},
		},
	],
});

type TriggersPayload = {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	// In the future, this will be an array
	conditions: ILivechatTrigger['conditions'];
	// In the future, this will be an array
	actions: ILivechatTrigger['actions'];
};

const EditTrigger = ({ triggerData }: { triggerData?: Serialized<ILivechatTrigger> }) => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveTrigger = useEndpoint('POST', '/v1/livechat/triggers');

	const {
		control,
		handleSubmit,
		formState: { isDirty, errors },
		watch,
	} = useForm<TriggersPayload>({ mode: 'onBlur', values: getInitialValues(triggerData) });

	const { fields: conditionsFields } = useFieldArray({
		control,
		name: 'conditions',
	});

	const { fields: actionsFields } = useFieldArray({
		control,
		name: 'actions',
	});

	const { description, conditions, actions } = watch();

	const conditionOptions: SelectOption[] = useMemo(
		() => [
			['page-url', t('Visitor_page_URL')],
			['time-on-site', t('Visitor_time_on_site')],
			['chat-opened-by-visitor', t('Chat_opened_by_visitor')],
			['after-guest-registration', t('After_guest_registration')],
		],
		[t],
	);

	const conditionValuePlaceholders: { [conditionName: string]: string } = useMemo(
		() => ({
			'page-url': t('Enter_a_regex'),
			'time-on-site': t('Time_in_seconds'),
		}),
		[t],
	);

	const senderOptions: SelectOption[] = useMemo(
		() => [
			['queue', t('Impersonate_next_agent_from_queue')],
			['custom', t('Custom_agent')],
		],
		[t],
	);

	const saveTriggerMutation = useMutation({
		mutationFn: saveTrigger,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			queryClient.invalidateQueries(['livechat-triggers']);
			router.navigate('/omnichannel/triggers');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleSave = async (data: TriggersPayload) => {
		saveTriggerMutation.mutateAsync({ ...data, _id: triggerData?._id });
	};

	const formId = useUniqueId();
	const enabledField = useUniqueId();
	const runOnceField = useUniqueId();
	const nameField = useUniqueId();
	const descriptionField = useUniqueId();
	const conditionField = useUniqueId();
	const actionField = useUniqueId();
	const actionMessageField = useUniqueId();

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
							<Box display='flex' flexDirection='row'>
								<FieldLabel htmlFor={enabledField}>{t('Enabled')}</FieldLabel>
								<FieldRow>
									<Controller
										name='enabled'
										control={control}
										render={({ field: { value, ...field } }) => <ToggleSwitch id={enabledField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Box>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row'>
								<FieldLabel htmlFor={runOnceField}>{t('Run_only_once_for_each_visitor')}</FieldLabel>
								<FieldRow>
									<Controller
										name='runOnce'
										control={control}
										render={({ field: { value, ...field } }) => <ToggleSwitch id={runOnceField} {...field} checked={value} />}
									/>
								</FieldRow>
							</Box>
						</Field>
						<Field>
							<FieldLabel htmlFor={nameField} required>
								{t('Name')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='name'
									control={control}
									rules={{ required: t('The_field_is_required', t('Name')) }}
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
								<Controller
									name='description'
									control={control}
									render={({ field }) => <TextInput id={descriptionField} {...field} value={description} />}
								/>
							</FieldRow>
						</Field>
						{conditionsFields.map((_, index) => {
							const conditionValuePlaceholder = conditionValuePlaceholders[conditions[index].name];
							return (
								<Field key={index}>
									<FieldLabel htmlFor={conditionField}>{t('Condition')}</FieldLabel>
									<FieldRow>
										<Controller
											name={`conditions.${index}.name`}
											control={control}
											render={({ field }) => <Select id={conditionField} {...field} options={conditionOptions} />}
										/>
									</FieldRow>
									{conditionValuePlaceholder && (
										<FieldRow>
											<Controller
												name={`conditions.${index}.value`}
												control={control}
												render={({ field }) => <TextInput {...field} placeholder={conditionValuePlaceholder} />}
											/>
										</FieldRow>
									)}
								</Field>
							);
						})}
						{actionsFields.map((_, index) => (
							<Field key={index}>
								<FieldLabel htmlFor={actionField}>{t('Action')}</FieldLabel>
								<FieldRow>
									<TextInput value={t('Send_a_message')} readOnly />
								</FieldRow>
								<FieldRow>
									<Controller
										name={`actions.${index}.params.sender`}
										control={control}
										render={({ field }) => (
											<Select id={actionField} {...field} options={senderOptions} placeholder={t('Select_an_option')} />
										)}
									/>
								</FieldRow>
								{actions[index].params?.sender === 'custom' && (
									<FieldRow>
										<Controller
											name={`actions.${index}.params.name`}
											control={control}
											render={({ field }) => <TextInput {...field} placeholder={t('Name_of_agent')} />}
										/>
									</FieldRow>
								)}
								<FieldRow>
									<Controller
										name={`actions.${index}.params.msg`}
										control={control}
										rules={{ required: t('The_field_is_required', t('Message')) }}
										render={({ field }) => (
											<TextAreaInput
												error={errors.actions?.[index]?.params?.msg?.message}
												aria-invalid={Boolean(errors.actions?.[index]?.params?.msg)}
												aria-describedby={`${actionMessageField}-error`}
												aria-required={true}
												{...field}
												rows={3}
												placeholder={`${t('Message')}*`}
											/>
										)}
									/>
								</FieldRow>
								{errors.actions?.[index]?.params?.msg && (
									<FieldError aria-live='assertive' id={`${actionMessageField}-error`}>
										{errors.actions?.[index]?.params?.msg?.message}
									</FieldError>
								)}
							</Field>
						))}
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={() => router.navigate('/omnichannel/triggers')}>{t('Cancel')}</Button>
					<Button form={formId} type='submit' primary disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default EditTrigger;
