import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Field, TextInput, ToggleSwitch, Select, TextAreaInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC, FormEvent } from 'react';
import React, { useMemo, useState } from 'react';

import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';

type TriggerConditions = {
	name: string;
	value: string | number;
};

type TriggerActions = {
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
	handlers: {
		handleName: (event: FormEvent<HTMLInputElement>) => void;
		handleDescription: (event: FormEvent<HTMLInputElement>) => void;
		handleEnabled: (event: FormEvent<HTMLInputElement>) => void;
		handleRunOnce: (event: FormEvent<HTMLInputElement>) => void;
		handleConditions: (value: TriggerConditions) => void;
		handleActions: (value: TriggerActions) => void;
	};
	className?: ComponentProps<typeof Field>['className'];
};

const TriggersForm: FC<TriggersFormProps> = ({ values, handlers, className }) => {
	const [nameError, setNameError] = useState('');
	const [msgError, setMsgError] = useState('');
	const t = useTranslation();
	const { name, description, enabled, runOnce, conditions, actions } = values;

	const { handleName, handleDescription, handleEnabled, handleRunOnce, handleConditions, handleActions } = handlers;

	const { name: conditionName, value: conditionValue } = conditions;

	const {
		params: { sender: actionSender, msg: actionMsg, name: actionAgentName },
	} = actions;

	const conditionOptions: SelectOption[] = useMemo(
		() => [
			['page-url', t('Visitor_page_URL')],
			['time-on-site', t('Visitor_time_on_site')],
			['chat-opened-by-visitor', t('Chat_opened_by_visitor')],
			['after-starting-chat', t('After_starting_chat')],
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

	const handleConditionName = useMutableCallback((name) => {
		handleConditions({
			name,
			value: '',
		});
	});

	const handleConditionValue = useMutableCallback(({ currentTarget: { value } }) => {
		handleConditions({
			...conditions,
			value,
		});
	});

	const handleActionAgentName = useMutableCallback(({ currentTarget: { value: name } }) => {
		handleActions({
			...actions,
			params: {
				...actions.params,
				name,
			},
		});
	});

	const handleActionSender = useMutableCallback((sender) => {
		handleActions({
			...actions,
			params: {
				...actions.params,
				sender,
			},
		});
	});

	const handleActionMessage = useMutableCallback(({ currentTarget: { value: msg } }) => {
		handleActions({
			...actions,
			params: {
				...actions.params,
				msg,
			},
		});
	});
	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', t('Name')) : '');
	}, [t, name]);
	useComponentDidUpdate(() => {
		setMsgError(!actionMsg ? t('The_field_is_required', t('Message')) : '');
	}, [t, actionMsg]);
	return (
		<>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={enabled} onChange={handleEnabled} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label>{t('Run_only_once_for_each_visitor')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={runOnce} onChange={handleRunOnce} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput value={name} error={nameError} onChange={handleName} placeholder={t('Name')} />
				</Field.Row>
				<Field.Error>{nameError}</Field.Error>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput value={description} onChange={handleDescription} placeholder={t('Description')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Condition')}</Field.Label>
				<Field.Row>
					<Select options={conditionOptions} value={conditionName} onChange={handleConditionName} />
				</Field.Row>
				{conditionValuePlaceholder && (
					<Field.Row>
						<TextInput value={conditionValue} onChange={handleConditionValue} placeholder={conditionValuePlaceholder} />
					</Field.Row>
				)}
			</Field>
			<Field className={className}>
				<Field.Label>{t('Action')}</Field.Label>
				<Field.Row>
					<TextInput value={t('Send_a_message')} disabled />
				</Field.Row>
				<Field.Row>
					<Select options={senderOptions} value={actionSender} onChange={handleActionSender} placeholder={t('Select_an_option')} />
				</Field.Row>
				{actionSender === 'custom' && (
					<Field.Row>
						<TextInput value={actionAgentName} onChange={handleActionAgentName} placeholder={t('Name_of_agent')} />
					</Field.Row>
				)}
				<Field.Row>
					<TextAreaInput rows={3} value={actionMsg} onChange={handleActionMessage} placeholder={`${t('Message')}*`} />
				</Field.Row>
				<Field.Error>{msgError}</Field.Error>
			</Field>
		</>
	);
};

export default TriggersForm;
