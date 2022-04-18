import { IRoom, IUser } from '@rocket.chat/core-typings';
import { CheckBox, Option, Menu } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../../../contexts/TranslationContext';
import { useActionSpread, MenuOption } from '../../../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../../../hooks/useUserInfoActions';

type MemberItemUserActionsProps = {
	user: Pick<IUser, '_id' | 'username'>;
	rid: IRoom['_id'];
	reload: () => void;
};

const MemberItemUserActions = ({ user, rid, reload }: MemberItemUserActionsProps): ReactElement | null => {
	const t = useTranslation();
	const { menu: menuOptions } = useActionSpread(useUserInfoActions(user, rid, reload), 0);
	if (!menuOptions) {
		return null;
	}

	const customOptions = {
		openDirectMessage: menuOptions.openDirectMessage,
		muteUser: menuOptions.muteUser,
		...(menuOptions.ignoreUser && { ignoreUser: menuOptions.ignoreUser }),
		removeUser: menuOptions.removeUser,
		rolesDivider: {
			type: 'divider',
		},
		heading: {
			type: 'heading',
			label: t('Roles'),
		},
		changeOwner: {
			label: { ...menuOptions.changeOwner.label, label: t('Owner') },
			action: menuOptions.changeOwner.action,
		},
		changeLeader: {
			label: { ...menuOptions.changeLeader.label, label: t('Leader') },
			action: menuOptions.changeLeader.action,
		},
		changeModerator: {
			label: { ...menuOptions.changeModerator.label, label: t('Moderator') },
			action: menuOptions.changeModerator.action,
		},
	};

	const renderOptions = ({ label: { label, icon, checkOption, isChecked }, ...props }: { label: MenuOption['label'] }): ReactElement => {
		if (checkOption) {
			return (
				<Option label={label} icon={icon} {...props}>
					<CheckBox checked={isChecked} />
				</Option>
			);
		}

		return <Option {...props} label={label} icon={icon} />;
	};

	return <Menu flexShrink={0} key='menu' tiny renderItem={renderOptions} options={customOptions} />;
};

export default MemberItemUserActions;
