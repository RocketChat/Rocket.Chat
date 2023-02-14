import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Field, TextInput, ToggleSwitch, Select, TextAreaInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React, { useMemo } from 'react';
import type { FieldErrorsImpl } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

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

type TriggersFormProps = {
	values: {
		name: string;
		description: string;
		enabled: boolean;
		runOnce: boolean;
		// In the future, this will be an array
		conditions: TriggerConditions;
		// In the future, this will be an array
		actions: TriggerActions;
	};
	className?: ComponentProps<typeof Field>['className'];
};

type ErrorsType = FieldErrorsImpl<{
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	conditions: {
		name: string;
		value: NonNullable<string | number>;
	};
	actions: {
		name: string;
		params: {
			sender: string;
			msg: string;
			name: string;
		};
	};
}>;

const TriggersForm: FC<TriggersFormProps> = ({ values, className }) => {
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext();

	const {
		field: { onChange: handleEnabled, value: valueEnabled },
	} = useController({
		name: 'enabled',
		control,
	});
	const {
		field: { onChange: handleRunOnce, value: valueRunOnce },
	} = useController({
		name: 'runOnce',
		control,
	});
	const {
		field: { onChange: handleActionSender, value: valueActionSender },
	} = useController({
		name: 'actions.params.sender',
		control,
	});
	const {
		field: { onChange: handleConditionName, value: valueConditionName },
	} = useController({
		name: 'conditions.name',
		control,
	});

	// const [msgError, setMsgError] = useState('');
	const t = useTranslation();
	const { conditions, actions } = values;

	const { name: conditionName } = conditions || {};

	const {
		params: { sender: actionSender },
	} = actions || { params: {} };

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

	// useComponentDidUpdate(() => {
	// 	setMsgError(!actionMsg ? t('The_field_is_required', t('Message')) : '');
	// }, [t, actionMsg]);
	return (
		<>
			<Field className={className}>
				<Box data-qa='TriggerToggle-Enabled' display='flex' flexDirection='row'>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={valueEnabled} onChange={handleEnabled} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Box data-qa='TriggerToggle-RunOnce' display='flex' flexDirection='row'>
					<Field.Label>{t('Run_only_once_for_each_visitor')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={valueRunOnce} onChange={handleRunOnce} />
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
					<TextInput data-qa='TriggerTextInput-Description' {...register('description')} placeholder={t('Description')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Condition')}</Field.Label>
				<Field.Row>
					<Select options={conditionOptions} value={valueConditionName} onChange={handleConditionName} />
				</Field.Row>
				{conditionValuePlaceholder && (
					<Field.Row>
						<TextInput
							data-qa='TriggerTextInput-ConditionValue'
							{...register('conditions.value')}
							placeholder={conditionValuePlaceholder}
						/>
					</Field.Row>
				)}
			</Field>
			<Field className={className}>
				<Field.Label>{t('Action')}</Field.Label>
				<Field.Row>
					<TextInput value={t('Send_a_message')} disabled />
				</Field.Row>
				<Field.Row>
					<Select options={senderOptions} value={valueActionSender} onChange={handleActionSender} placeholder={t('Select_an_option')} />
				</Field.Row>
				{actionSender === 'custom' && (
					<Field.Row>
						<TextInput data-qa='TriggerTextInput-ActionAgentName' {...register('actions.params.name')} placeholder={t('Name_of_agent')} />
					</Field.Row>
				)}
				<Field.Row>
					<TextAreaInput
						rows={3}
						data-qa='TriggerTextAreaInput-ActionMsg'
						{...register('actions.params.msg', { required: t('The_field_is_required', t('Message')) })}
						placeholder={`${t('Message')}*`}
					/>
				</Field.Row>
				{(errors as ErrorsType)?.actions?.params?.msg && (
					<Field.Error>{(errors as ErrorsType)?.actions?.params?.msg?.message || ''}</Field.Error>
				)}
			</Field>
		</>
	);
};

export default TriggersForm;
