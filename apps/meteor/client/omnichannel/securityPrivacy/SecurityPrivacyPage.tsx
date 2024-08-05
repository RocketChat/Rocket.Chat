import { useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useEditableSettingsGroupSections } from '../../views/admin/EditableSettingsContext';
import GroupPage from '../../views/admin/settings/GroupPage';
import Section from '../../views/admin/settings/Section';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const GROUP_ID = 'Omnichannel';
const SECTION_ID = 'Contact_identification';

const SecurityPrivacyPage = () => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const sections = useEditableSettingsGroupSections(GROUP_ID).filter((id) => id === SECTION_ID);
	const solo = sections.length === 1;

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return (
		<GroupPage i18nLabel='Security_and_privacy' _id={GROUP_ID}>
			{sections.map((sectionName) => (
				<Section key={sectionName || ''} groupId={GROUP_ID} sectionName={sectionName} solo={solo} />
			))}
		</GroupPage>
	);
};

export default SecurityPrivacyPage;
