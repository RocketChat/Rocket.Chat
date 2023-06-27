import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../../../components/Contextualbar';
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
			<ContextualbarHeader>
				{(context === 'info' || !context) && (
					<>
						<ContextualbarIcon name='info-circled' />
						<ContextualbarTitle>{t('Contact_Info')}</ContextualbarTitle>
					</>
				)}
				{context === 'edit' && (
					<>
						<ContextualbarIcon name='pencil' />
						<ContextualbarTitle>{t('Edit_Contact_Profile')}</ContextualbarTitle>
					</>
				)}
				<ContextualbarClose onClick={closeContextualBar} />
			</ContextualbarHeader>
			{context === 'edit' ? (
				<ContactEditWithData id={_id} close={handleContactEditBarCloseButtonClick} />
			) : (
				<ContactInfo id={_id} rid={rid} route={PATH} />
			)}
		</>
	);
};

export default ContactsContextualBar;
