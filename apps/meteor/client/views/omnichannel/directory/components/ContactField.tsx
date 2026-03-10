import type { IOmnichannelGenericRoom, IVisitor } from '@rocket.chat/core-typings';
import { Avatar, Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { FormSkeleton } from './FormSkeleton';
import { UserStatus } from '../../../../components/UserStatus';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import AgentInfoDetails from '../../components/AgentInfoDetails';
import Field from '../../components/Field';
import Info from '../../components/Info';
import Label from '../../components/Label';

type ContactFieldProps = {
	contact: IVisitor;
	room: IOmnichannelGenericRoom;
};

const ContactField = ({ contact, room }: ContactFieldProps) => {
	const { t } = useTranslation();
	const { status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomCoordinator.getRoomDirectives(type).getAvatarPath(room) || '';

	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');
	const { data, isPending, isError } = useQuery({
		queryKey: ['/v1/livechat/visitors.info', contact._id],
		queryFn: () => getVisitorInfo({ visitorId: contact._id }),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError || !data?.visitor) {
		return <Box mbs={16}>{t('Contact_not_found')}</Box>;
	}

	const {
		visitor: { username, name, phone },
	} = data;

	const displayName = name || username;
	const phoneNumber = phone?.[0]?.phoneNumber;
	const shortName = username && phoneNumber && username !== phoneNumber ? `${username} · ${phoneNumber}` : username || phoneNumber;

	return (
		<Field>
			<Label>{t('Contact')}</Label>
			<Info style={{ display: 'flex' }}>
				<Avatar size='x40' title={fname} url={avatarUrl} />
				<AgentInfoDetails mis={10} name={displayName} shortName={shortName} status={<UserStatus status={status} />} />
			</Info>
		</Field>
	);
};

export default ContactField;
