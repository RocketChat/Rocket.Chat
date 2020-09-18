import React, { useRef, useState } from 'react';
import { Box, Field, TextInput, ButtonGroup, Button, Margins, Tabs } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../../client/components/basic/Page';
import DateRangePicker from './DateRangePicker';
import RoomAutoComplete from './RoomAutoComplete';
import UserAutoCompleteMultiple from './UserAutoCompleteMultiple';
import VisitorAutoComplete from './VisitorAutoComplete';
import Result from './Result';
import { AutoCompleteAgent } from '../../../client/components/basic/AutoCompleteAgent';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useForm } from '../../../client/hooks/useForm';

const initialValues = {
	msg: '',
	type: '',
	dateRange: {
		start: '',
		end: '',
	},
	visitor: '',
	agent: '',
	rid: '',
	users: [],
};

const AuditPage = () => {
	const t = useTranslation();

	const { values, handlers } = useForm(initialValues);
	const setData = useRef(() => {});

	const [errors, setErrors] = useState({});

	const {
		msg,
		type,
		dateRange: {
			start: startDate,
			end: endDate,
		},
		visitor,
		agent,
		users,
		rid,
	} = values;

	const {
		handleMsg,
		handleType,
		handleVisitor,
		handleAgent,
		handleUsers,
		handleRid,
		handleDateRange,
	} = handlers;

	const useHandleType = (type) => useMutableCallback(() => {
		handleType(type);
	});

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const apply = useMutableCallback(() => {
		if (!rid && type === '') {
			return setErrors({
				rid: t('The_field_is_required', t('room_name')),
			});
		}

		if (users.length < 2 && type === 'd') {
			return setErrors({
				users: t('Select_at_least_two_users'),
			});
		}

		if (type === 'l') {
			const errors = {};

			if (visitor === '') {
				errors.visitor = t('The_field_is_required', t('Visitor'));
			}

			if (agent === '') {
				errors.visitor = t('The_field_is_required', t('Agent'));
			}

			if (errors.visitor || errors.agent) {
				return setErrors(errors);
			}
		}

		setErrors({});
		setData.current({
			msg,
			type,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			visitor,
			agent,
			users,
			rid,
		});
	});

	return <Page>
		<Page.Header title={t('Message_auditing')} />
		<Tabs>
			<Tabs.Item selected={type === ''} onClick={useHandleType('')}>{t('Others')}</Tabs.Item>
			<Tabs.Item selected={type === 'd'} onClick={useHandleType('d')}>{t('Direct_Messages')}</Tabs.Item>
			<Tabs.Item selected={type === 'l'} onClick={useHandleType('l')}>{t('Omnichannel')}</Tabs.Item>
		</Tabs>
		<Page.ScrollableContentWithShadow mb='neg-x4'>
			<Margins block='x4'>
				<Box display='flex' flexDirection='row' mi='neg-x4'>
					<Margins inline='x4'>
						<Field>
							<Field.Label>{t('Message')}</Field.Label>
							<Field.Row>
								<TextInput value={msg} onChange={handleMsg} placeholder={t('Search')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Date')}</Field.Label>
							<Field.Row>
								<DateRangePicker onChange={handleDateRange} display='flex' flexGrow={1}/>
							</Field.Row>
						</Field>
					</Margins>
				</Box>
				<Box display='flex' flexDirection='row'>
					{type === '' && <Field>
						<Field.Label>{t('room_name')}</Field.Label>
						<Field.Row>
							<RoomAutoComplete error={errors.rid} value={rid} onChange={handleRid} placeholder={t('Channel_Name_Placeholder')}/>
						</Field.Row>
						{errors.rid && <Field.Error>
							{errors.rid}
						</Field.Error>}
					</Field>}
					{type === 'd' && <Field>
						<Field.Label>{t('Users')}</Field.Label>
						<Field.Row>
							<UserAutoCompleteMultiple error={errors.users} value={users} onChange={onChangeUsers} placeholder={t('Username_Placeholder')}/>
						</Field.Row>
						{errors.users && <Field.Error>
							{errors.users}
						</Field.Error>}
					</Field>}
					{type === 'l' && <Box display='flex' flexDirection='row' w='full' mi='neg-x4'>
						<Margins inline='x4'>
							<Field>
								<Field.Label>{t('Visitor')}</Field.Label>
								<Field.Row>
									<VisitorAutoComplete error={errors.visitor} value={visitor} onChange={handleVisitor} placeholder={t('Username_Placeholder')}/>
								</Field.Row>
								{errors.visitor && <Field.Error>
									{errors.visitor}
								</Field.Error>}
							</Field>
							<Field>
								<Field.Label>{t('Agent')}</Field.Label>
								<Field.Row>
									<AutoCompleteAgent error={errors.agent} value={agent} onChange={handleAgent} placeholder={t('Username_Placeholder')}/>
								</Field.Row>
								{errors.agent && <Field.Error>
									{errors.agent}
								</Field.Error>}
							</Field>
						</Margins>
					</Box>}
				</Box>
				<ButtonGroup mis='x8' align='end'>
					<Button primary onClick={apply}>{t('Apply')}</Button>
				</ButtonGroup>
				<Result setDataRef={setData} />
			</Margins>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AuditPage;
