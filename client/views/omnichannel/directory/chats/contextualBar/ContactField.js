import { Avatar } from '@rocket.chat/fuselage';
import React from 'react';

import { roomTypes } from '../../../../../../app/utils/client';
import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import Info from './Info';
import Label from './Label';

const ContactField = ({ contact, room }) => {
	const t = useTranslation();
	const { username, status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath(room);

	return (
		<>
			<Label>{t('Contact')}</Label>
			<Info style={{ display: 'flex' }}>
				<Avatar size='x40' title={fname} url={avatarUrl} />
				<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			</Info>
		</>
	);
};

export default ContactField;
