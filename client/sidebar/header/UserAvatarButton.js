import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import { popover } from '../../../app/ui-utils';
import { useSetting } from '../../contexts/SettingsContext';
import { UserStatus } from '../../components/UserStatus';
import { createTemplateForComponent } from '../../reactAdapters';
import UserAvatar from '../../components/avatar/UserAvatar';

const UserDropdown = createTemplateForComponent('UserDropdown', () => import('./UserDropdown'));

const openDropdown = (e, user, onClose, allowAnonymousRead) => {
	if (!(Meteor.userId() == null && allowAnonymousRead)) {
		popover.open({
			template: UserDropdown,
			currentTarget: e.currentTarget,
			data: {
				user,
				onClose,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		});
	}
};

export default React.memo(({ user = {} }) => {
	const {
		_id: uid,
		status = !uid && 'online',
		username = 'Anonymous',
		avatarETag,
	} = user;

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const onClose = useMutableCallback(() => popover.close());

	const handleClick = useMutableCallback((e) => uid && openDropdown(e, user, onClose, allowAnonymousRead));

	return <Box position='relative' onClick={handleClick} className={css`cursor: pointer;`} data-qa='sidebar-avatar-button'>
		<UserAvatar size='x24' username={username} etag={avatarETag}/>
		<Box className={css`bottom: 0; right: 0;`} justifyContent='center' alignItems='center'display='flex' overflow='hidden' size='x12' borderWidth='x2' position='absolute' bg='neutral-200' borderColor='neutral-200' borderRadius='full' mie='neg-x2' mbe='neg-x2'>
			<UserStatus small status={status}/>
		</Box>
	</Box>;
});
