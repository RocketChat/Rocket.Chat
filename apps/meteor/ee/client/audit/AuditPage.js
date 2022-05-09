import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useState } from 'react';

import { useForm } from '../../../client/hooks/useForm';
import { AuditPageBase } from './AuditPageBase';

const initialValues = {
	msg: '',
	type: '',
	dateRange: {
		start: '',
		end: '',
	},
	visitor: '',
	agent: 'all',
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
		dateRange: { start: startDate, end: endDate },
		visitor,
		agent,
		users,
		rid,
	} = values;

	const { handleMsg, handleType, handleVisitor, handleAgent, handleUsers, handleRid, handleDateRange } = handlers;

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const apply = useMutableCallback((eventStats) => {
		if (!rid && type === '') {
			return setErrors({
				rid: t('The_field_is_required', t('Channel_name')),
			});
		}

		if (users.length < 2 && type === 'd') {
			return setErrors({
				users: t('Select_at_least_two_users'),
			});
		}

		if (type === 'l') {
			const errors = {};

			if (agent === '') {
				errors.agent = t('The_field_is_required', t('Agent'));
			}

			if (visitor === '') {
				errors.visitor = t('The_field_is_required', t('Visitor'));
			}

			if (errors.visitor || errors.agent) {
				return setErrors(errors);
			}
		}

		setErrors({});
		eventStats();
		setData.current({
			msg,
			type,
			startDate: new Date(startDate),
			endDate: new Date(`${endDate}T23:59:00`),
			visitor,
			agent,
			users,
			rid,
		});
	});

	return (
		<AuditPageBase
			type={type}
			handleType={handleType}
			msg={msg}
			handleMsg={handleMsg}
			handleDateRange={handleDateRange}
			errors={errors}
			rid={rid}
			handleRid={handleRid}
			users={users}
			handleUsers={handleUsers}
			onChangeUsers={onChangeUsers}
			visitor={visitor}
			handleVisitor={handleVisitor}
			agent={agent}
			handleAgent={handleAgent}
			apply={apply}
			setData={setData}
		/>
	);
};

export default AuditPage;
