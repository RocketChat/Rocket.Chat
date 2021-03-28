import { Icon, Box } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useRoom } from '../../../../room/providers/RoomProvider';
import { ContactInfo } from './ContactInfo';

const ContactsContextualBar = ({ rid }) => {
	const t = useTranslation();

	const directoryRoute = useRoute('live');

	const closeContextualBar = () => {
		directoryRoute.push({ id: rid });
	};
	const room = useRoom();

	const {
		v: { _id },
	} = room;

	return (
		<>
			<VerticalBar.Header>
				<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
					<Icon name='user' size='x20' /> {t('Contact_Profile')}
				</Box>
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			<ContactInfo id={_id} />
		</>
	);
};

export default ContactsContextualBar;
