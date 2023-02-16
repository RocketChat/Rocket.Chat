import type { SelectOption } from '@rocket.chat/fuselage';
import { Button, Margins, FieldGroup, Box, Field, TextInput, ToggleSwitch, Select, TextAreaInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React, { useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';

export type TriggerConditions = {
	name: string;
	value: string | number;
};

export type TriggerActions = {
	name: string;
	params: {
		sender: string | undefined;
		msg: string;
		name: string;
	};
};

export type TriggerFormValues = {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	// In the future, this will be an array
	conditions: TriggerConditions;
	// In the future, this will be an array
	actions: TriggerActions;
};

type TriggersFormProps = {
	onSave: (values: TriggerFormValues) => Promise<void>;
	initialValues?: TriggerFormValues;
	className?: ComponentProps<typeof Field>['className'];
};

const DEFAULT_FORM_VALUES = {
	name: '',
	description: '',
	enabled: true,
	runOnce: false,
	conditions: {
		name: 'page-url',
		value: '',
	},
	actions: {
		name: '',
		params: {
			sender: 'queue',
			msg: '',
			name: '',
		},
	},
};

const TriggersForm: FC<TriggersFormProps> = ({ onSave, className, initialValues = DEFAULT_FORM_VALUES }) => {
	const {
		register,
		formState: { errors, isValid, isDirty },
		watch,
		handleSubmit,
		control,
	} = useForm<TriggerFormValues>({ defaultValues: initialValues });

	const { field: enabledField } = useController({
		name: 'enabled',
		control,
	});
	const { field: runOnceField } = useController({
		name: 'runOnce',
		control,
	});
	const { field: actionSenderField } = useController({
		name: 'actions.params.sender',
		control,
	});
	const { field: conditionNameField } = useController({
		name: 'conditions.name',
		control,
	});

	const t = useTranslation();

	const conditionName = watch('conditions.name');
	const actionSender = watch('actions.params.sender');

	const conditionOptions: SelectOption[] = useMemo(
		() => [
			['page-url', t('Visitor_page_URL')],
			['time-on-site', t('Visitor_time_on_site')],
			['chat-opened-by-visitor', t('Chat_opened_by_visitor')],
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

	const conditionValuePlaceholder = conditionValuePlaceholders[conditionName];

	const senderOptions: SelectOption[] = useMemo(
		() => [
			['queue', t('Impersonate_next_agent_from_queue')],
			['custom', t('Custom_agent')],
		],
		[t],
	);

	const canSave = isValid && isDirty;

	return (
		<form onSubmit={handleSubmit(onSave)}>
			<FieldGroup>
				<Field className={className}>
					<Box display='flex' flexDirection='row'>
						<Field.Label>{t('Enabled')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={enabledField.value} onChange={enabledField.onChange} />
						</Field.Row>
					</Box>
				</Field>
				<Field className={className}>
					<Box display='flex' flexDirection='row'>
						<Field.Label>{t('Run_only_once_for_each_visitor')}</Field.Label>
						<Field.Row>
							<ToggleSwitch checked={runOnceField.value} onChange={runOnceField.onChange} />
						</Field.Row>
					</Box>
				</Field>
				<Field className={className}>
					<Field.Label>{t('Name')}*</Field.Label>
					<Field.Row>
						<TextInput
							{...register('name', { required: t('The_field_is_required', t('Name')) })}
							error={errors?.name?.message as string}
							placeholder={t('Name')}
						/>
					</Field.Row>
					{errors?.name && <Field.Error>{errors.name?.message}</Field.Error>}
				</Field>
				<Field className={className}>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextInput {...register('description')} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				<Field className={className}>
					<Field.Label>{t('Condition')}</Field.Label>
					<Field.Row>
						<Select options={conditionOptions} value={conditionNameField.value} onChange={conditionNameField.onChange} />
					</Field.Row>
					{conditionValuePlaceholder && (
						<Field.Row>
							<TextInput {...register('conditions.value')} placeholder={conditionValuePlaceholder} />
						</Field.Row>
					)}
				</Field>
				<Field className={className}>
					<Field.Label>{t('Action')}</Field.Label>
					<Field.Row>
						<TextInput value={t('Send_a_message')} disabled />
					</Field.Row>
					<Field.Row>
						<Select
							options={senderOptions}
							value={actionSenderField.value}
							onChange={actionSenderField.onChange}
							placeholder={t('Select_an_option')}
						/>
					</Field.Row>
					{actionSender === 'custom' && (
						<Field.Row>
							<TextInput data-qa='TriggerTextInput-ActionAgentName' {...register('actions.params.name')} placeholder={t('Name_of_agent')} />
						</Field.Row>
					)}
					<Field.Row>
						<TextAreaInput
							rows={3}
							{...register('actions.params.msg', { required: t('The_field_is_required', t('Message')) })}
							placeholder={`${t('Message')}*`}
						/>
					</Field.Row>
					{errors?.actions?.params?.msg && <Field.Error>{errors?.actions?.params?.msg?.message || ''}</Field.Error>}
				</Field>
			</FieldGroup>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='submit' primary disabled={!canSave}>
						{t('Save')}
					</Button>
				</Margins>
			</Box>
		</form>
	);
};

export default TriggersForm;
