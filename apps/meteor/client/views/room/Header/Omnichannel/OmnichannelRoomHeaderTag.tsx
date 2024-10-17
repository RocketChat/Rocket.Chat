import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import AdvancedContactModal from '../../../omnichannel/contactInfo/AdvancedContactModal';

type OmnichannelRoomHeaderTagProps = {
	room: IOmnichannelRoom;
};

const OmnichannelRoomHeaderTag = ({ room }: OmnichannelRoomHeaderTagProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const {
		v: { _id, contactId },
	} = room;

	const getContactById = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const { data } = useQuery(['getContactById', contactId], () => getContactById({ contactId: contactId || _id }));
	const isVerifiedContact = data?.contact?.channels?.some((channel) => channel.verified);

	console.log(isVerifiedContact);

	useEffect(() => {
		if (!isVerifiedContact) {
			setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}
	}, [isVerifiedContact, setModal]);

	if (isVerifiedContact) {
		return <Icon mis={4} size='x16' name='success-circle' color='stroke-highlight' />;
	}

	return (
		<Box mis={4} withTruncatedText>
			<Tag
				onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)}
				icon={<Icon size='x12' mie={4} name='warning' />}
			>
				{t('Unverified')}
			</Tag>
		</Box>
	);
};

export default OmnichannelRoomHeaderTag;
