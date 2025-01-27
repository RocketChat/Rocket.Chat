import { useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';

import { useEditableSettingsGroupSections } from '../../views/admin/EditableSettingsContext';
import GenericGroupPage from '../../views/admin/settings/groups/GenericGroupPage';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const GROUP_ID = 'Omnichannel';
const SECTION_ID = 'Contact_identification';

const SecurityPrivacyPage = () => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const sections = useEditableSettingsGroupSections(GROUP_ID).filter((id) => id === SECTION_ID);

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	return <GenericGroupPage i18nLabel='Security_and_privacy' sections={sections} _id={GROUP_ID} />;
};

export default SecurityPrivacyPage;
