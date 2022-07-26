import { Avatar, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { UserStatus } from '../../../../../components/UserStatus';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

const ContactField = ({ contact, room }) => {
	const t = useTranslation();
	const { status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomCoordinator.getRoomDirectives(type)?.getAvatarPath(room);

	const {
		value: data,
		phase: state,
		error,
	} = useEndpointData(
		'/v1/livechat/visitors.info',
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
		<Field>
			<Label>{t('Contact')}</Label>
			<Info style={{ display: 'flex' }}>
				<Avatar size='x40' title={fname} url={avatarUrl} />
				<AgentInfoDetails mis='x10' name={displayName} shortName={username} status={<UserStatus status={status} />} />
			</Info>
		</Field>
	);
};

export default ContactField;
