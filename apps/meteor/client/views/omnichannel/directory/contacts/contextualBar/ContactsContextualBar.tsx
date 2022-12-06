import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useOmnichannelRoom } from '../../../../room/contexts/RoomContext';
import { useTabBarClose } from '../../../../room/contexts/ToolboxContext';
import ContactEditWithData from './ContactEditWithData';
import ContactInfo from './ContactInfo';

const PATH = 'live';

const ContactsContextualBar: FC<{ rid: IOmnichannelRoom['_id'] }> = ({ rid }) => {
	const t = useTranslation();

	const closeContextualBar = useTabBarClose();

	const directoryRoute = useRoute(PATH);

	const context = useRouteParameter('context');

	const handleContactEditBarCloseButtonClick = (): void => {
		directoryRoute.push({ id: rid, tab: 'contact-profile' });
	};

	const room = useOmnichannelRoom();

	const {
		v: { _id },
	} = room;

	return (
		<>
			<VerticalBar.Header>
				{(context === 'info' || !context) && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Contact_Info')}</VerticalBar.Text>
					</>
				)}
				{context === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('Edit_Contact_Profile')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			{context === 'edit' ? (
				<ContactEditWithData id={_id} close={handleContactEditBarCloseButtonClick} />
			) : (
				<ContactInfo id={_id} rid={rid} route={PATH} />
			)}
		</>
	);
};

export default ContactsContextualBar;
