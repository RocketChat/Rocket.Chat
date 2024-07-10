import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import ContactGroupAddMembers from './ContactGroupAddMembers';
import ContactGroupMembers from './ContactGroupMembers';

const ContactGroupsContextualBar = () => {
	const directoryRoute = useRoute('omnichannel-directory');
	const groupId = useRouteParameter('id') || '';
	const context = useRouteParameter('context');

	const handleClose = () => {
		directoryRoute.push({ tab: 'groups' });
	};

	const handleCancel = () => {
		directoryRoute.push({ tab: 'groups', context: 'info', id: groupId });
	};

	if (context === 'add') {
		return <ContactGroupAddMembers onClickBack={handleCancel} onClose={handleClose} />;
	}

	return (
		<ContactGroupMembers onAddContacts={() => directoryRoute.push({ tab: 'groups', context: 'add', id: groupId })} onClose={handleClose} />
	);
};

export default ContactGroupsContextualBar;
