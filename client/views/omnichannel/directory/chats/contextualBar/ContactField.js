import { Avatar, Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { roomTypes } from '../../../../../../app/utils/client';
import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const ContactField = ({ contact, room }) => {
	const t = useTranslation();
	const { status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath(room);

	const { value: data, phase: state, error } = useEndpointData(
		'livechat/visitors.info',
		useMemo(() => ({ visitorId: contact._id }), [contact._id]),
	);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.visitor) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	const {
		visitor: { username, name },
	} = data;

	const displayName = name || username;

	return (
		<>
			<Label>{t('Contact')}</Label>
			<Info style={{ display: 'flex' }}>
				<Avatar size='x40' title={fname} url={avatarUrl} />
				<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
				{username && name && (
					<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>
						({username})
					</Box>
				)}
			</Info>
		</>
	);
};

export default ContactField;
