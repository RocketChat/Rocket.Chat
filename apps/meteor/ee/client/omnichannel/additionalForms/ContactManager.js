import { Field } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, useCallback } from 'react';

import AutoCompleteAgent from '../../../../client/components/AutoCompleteAgent';

export const ContactManager = ({ value: username, handler }) => {
	const t = useTranslation();

	const [userId, setUserId] = useState();

	const getUserData = useEndpoint('GET', '/v1/users.info');

	const fetchUserId = async () => {
		const { user } = await getUserData({ username });
		user._id && setUserId(user._id);
	};

	const handleAgent = useCallback(
		async (e) => {
			setUserId(e);
			const { user } = await getUserData({ userId: e });
			handler(user.username);
		},
		[handler, setUserId, getUserData],
	);

	useEffect(() => {
		fetchUserId();
	});

	return (
		<Field>
			<Field.Label>{t('Contact_Manager')}</Field.Label>
			<Field.Row>
				<AutoCompleteAgent value={userId} onChange={handleAgent} />
			</Field.Row>
		</Field>
	);
};

export default ContactManager;
