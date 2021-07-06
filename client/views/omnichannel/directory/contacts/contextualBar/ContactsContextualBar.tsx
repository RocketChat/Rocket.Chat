import React, { FC } from 'react';

import { IOmnichannelRoom } from '../../../../../../definition/IRoom';
import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useOmnichannelRoom } from '../../../../room/contexts/RoomContext';
import { useTabBarClose } from '../../../../room/providers/ToolboxProvider';
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
