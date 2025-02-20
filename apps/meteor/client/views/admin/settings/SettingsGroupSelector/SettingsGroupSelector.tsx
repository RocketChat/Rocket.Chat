import type { ISetting } from '@rocket.chat/core-typings';
import { useSettingStructure } from '@rocket.chat/ui-contexts';

import SettingsGroupPageSkeleton from '../SettingsGroupPage/SettingsGroupPageSkeleton';
import BaseGroupPage from '../groups/BaseGroupPage';
import LDAPGroupPage from '../groups/LDAPGroupPage';
import OAuthGroupPage from '../groups/OAuthGroupPage';
import VoipGroupPage from '../groups/VoipGroupPage';

type SettingsGroupSelectorProps = {
	groupId: ISetting['_id'];
	onClickBack?: () => void;
};

const SettingsGroupSelector = ({ groupId, onClickBack }: SettingsGroupSelectorProps) => {
	const group = useSettingStructure(groupId);

	if (!group) {
		return <SettingsGroupPageSkeleton />;
	}

	if (groupId === 'OAuth') {
		return <OAuthGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'LDAP') {
		return <LDAPGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'VoIP_Omnichannel') {
		return <VoipGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'Assets') {
		return <BaseGroupPage {...group} onClickBack={onClickBack} hasReset={false} />;
	}

	return <BaseGroupPage {...group} onClickBack={onClickBack} />;
};

export default SettingsGroupSelector;
