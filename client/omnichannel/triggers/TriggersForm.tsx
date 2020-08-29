import React, { FC, FormEvent, useMemo } from 'react';
import { Box, Field, TextInput, ToggleSwitch, BoxClassName, Select, TextAreaInput, SelectOptions } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../contexts/TranslationContext';

type TriggerConditions = {
	name: string;
	value: string | number;
}

type TriggerActions = {
	name: string;
	params: {
		sender: string | undefined;
		msg: string;
		name: string;
	};
}

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
	className?: BoxClassName;
}

const TriggersForm: FC<TriggersFormProps> = ({ values, handlers, className }) => {
	const t = useTranslation();
	const {
		name,
		description,
		enabled,
		runOnce,
		conditions,
		actions,
	} = values;

	const {
		handleName,
		handleDescription,
		handleEnabled,
		handleRunOnce,
		handleConditions,
		handleActions,
	} = handlers;

	const {
		name: conditionName,
		value: conditionValue,
	} = conditions;

	const {
		params: {
			sender: actionSender,
			msg: actionMsg,
			name: actionAgentName,
		},
	} = actions;

	const conditionOptions: SelectOptions = useMemo(() => [
		['page-url', t('Visitor_page_URL')],
		['time-on-site', t('Visitor_time_on_site')],
	], [t]);

	const senderOptions: SelectOptions = useMemo(() => [
		['queue', t('Impersonate_next_agent_from_queue')],
		['custom', t('Custom_agent')],
	], [t]);

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
	return <>
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label>{t('Enabled')}</Field.Label>
				<Field.Row>
					<ToggleSwitch checked={enabled} onChange={handleEnabled}/>
				</Field.Row>
			</Box>
		</Field>
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label>{t('Run_only_once_for_each_visitor')}</Field.Label>
				<Field.Row>
					<ToggleSwitch checked={runOnce} onChange={handleRunOnce}/>
				</Field.Row>
			</Box>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={handleName} placeholder={t('Name')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextInput value={description} onChange={handleDescription} placeholder={t('Description')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Condition')}</Field.Label>
			<Field.Row>
				<Select options={conditionOptions} value={conditionName} onChange={handleConditionName}/>
			</Field.Row>
			<Field.Row>
				<TextInput value={conditionValue} onChange={handleConditionValue} placeholder={conditionName === 'page-url' ? t('Enter_a_regex') : t('Time_in_seconds')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Action')}</Field.Label>
			<Field.Row>
				<TextInput value={t('Send_a_message')} disabled/>
			</Field.Row>
			<Field.Row>
				<Select options={senderOptions} value={actionSender} onChange={handleActionSender} placeholder={t('Select_an_option')}/>
			</Field.Row>
			{actionSender === 'custom' && <Field.Row>
				<TextInput value={actionAgentName} onChange={handleActionAgentName} placeholder={t('Name_of_agent')}/>
			</Field.Row>}
			<Field.Row>
				<TextAreaInput rows={3} value={actionMsg} onChange={handleActionMessage} placeholder={t('Message')}/>
			</Field.Row>
		</Field>
	</>;
};

export default TriggersForm;
