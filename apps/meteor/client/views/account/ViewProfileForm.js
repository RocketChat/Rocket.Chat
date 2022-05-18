import { Field, FieldGroup, Box } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { useMemo, useEffect, useState } from 'react';

import UserAvatarEditor from '../../components/avatar/UserAvatarEditor';
import { useEndpointData } from '../../hooks/useEndpointData';
import ViewAccountInfo from './ViewAccountInfo';

function ViewProfileForm({ values, handlers, user, settings, ...props }) {
	const t = useTranslation();

	const getAvatarSuggestions = useMethod('getAvatarSuggestion');

	const [avatarSuggestions, setAvatarSuggestions] = useSafely(useState());

	const { email, username, password } = values;

	const { handleConfirmationPassword, handleAvatar } = handlers;

	useEffect(() => {
		const getSuggestions = async () => {
			const suggestions = await getAvatarSuggestions();
			setAvatarSuggestions(suggestions);
		};
		getSuggestions();
	}, [getAvatarSuggestions, setAvatarSuggestions]);

	useEffect(() => {
		if (!password) {
			handleConfirmationPassword('');
		}
	}, [password, handleConfirmationPassword]);

	const {
		// eslint-disable-next-line no-empty-pattern
		emails: [],
	} = user;

	const handleSubmit = (e) => {
		e.preventDefault();
	};

	// Refetch user data so that we can get createdAt field.
	const { value: data } = useEndpointData(
		'users.info',
		useMemo(() => ({ ...(username && { username }) }), [username]),
	);

	const userWithCredit = useMemo(() => {
		const { user } = data || { user: {} };
		return user || {};
	}, [data]);

	const dummyCredit = {
		gateway: 'bank-transfer',
		quantity: 7,
		amount: 500,
		currency: 'USD',
	};

	// eslint-disable-next-line no-unused-vars
	const buyCredit = useMemo(() => {
		if (!user.credit) {
			Meteor.call('buyCredit', dummyCredit, (error, result) => {
				if (result) {
					console.log('Bought credit');
				}
				if (error) {
					console.log(error);
				}
			});
		}
	}, [user.credit, dummyCredit]);

	// eslint-disable-next-line no-unused-vars
	const setRandomTrustScore = useMemo(() => {
		if (!user.trustScore) {
			Meteor.call('setRandomTrustScore', (error, result) => {
				if (result) {
					console.log('Set a random trust score');
				}
				if (error) {
					console.log(error);
				}
			});
		}
	}, [user.trustScore]);

	const careerItems = [
		{ icon: 'user', content: `${t('gso_viewProfileForm_careerItems_employee')}`, rc: true },
		{
			icon: 'credit',
			content: `${t('gso_viewProfileForm_careerItems_creditPoints')}: ${userWithCredit.credit ? userWithCredit.credit : 0}`,
			rc: false,
		},
		{
			icon: 'trust-score',
			content: `${t('gso_viewProfileForm_careerItems_trustScore')}: ${userWithCredit.trustScore ? userWithCredit.trustScore * 100 : 0}/100`,
			rc: false,
		},
	];

	const privateInfo = [
		{ icon: 'mail', content: `${email}`, rc: true },
		{ icon: 'phone', content: '+254 730430234', rc: true },
		{ icon: 'gender', content: 'Male', rc: false },
	];

	const services = [
		{ icon: 'lock', content: `${t('gso_viewProfileForm_services_updateProfile')}`, rc: true },
		{ icon: 'info', content: `${t('gso_viewProfileForm_services_customerSupport')}`, rc: false },
		{ icon: 'credit-card', content: `${t('gso_viewProfileForm_services_verifyIdentity')}`, rc: false },
		{ icon: 'info', content: `${t('gso_viewProfileForm_services_aboutUs')}`, rc: false },
	];

	return (
		<FieldGroup is='form' style={{ marginTop: '0px !important' }} autoComplete='off' onSubmit={handleSubmit} {...props}>
			{useMemo(
				() => (
					<Field>
						<UserAvatarEditor
							etag={user.avatarETag}
							currentUsername={user.username}
							username={username}
							setAvatarObj={handleAvatar}
							disabled={true}
							suggestions={avatarSuggestions}
							userId={user._id}
						/>
					</Field>
				),
				[username, user.username, handleAvatar, avatarSuggestions, user.avatarETag, user._id],
			)}
			<Box style={{ margin: '0px auto', fontSize: '16px' }}>{user.bio ? user.bio : 'No user bio...'}</Box>
			<Box display='flex' flexDirection='column' style={{ marginTop: '30px' }}>
				<ViewAccountInfo title={t('gso_viewProfileForm_viewAccountInfo_careerItems')} items={careerItems} />
				<ViewAccountInfo title={t('gso_viewProfileForm_viewAccountInfo_privateInfo')} items={privateInfo} />
				<ViewAccountInfo title={t('gso_viewProfileForm_viewAccountInfo_services')} items={services} />
			</Box>
		</FieldGroup>
	);
}

export default ViewProfileForm;
