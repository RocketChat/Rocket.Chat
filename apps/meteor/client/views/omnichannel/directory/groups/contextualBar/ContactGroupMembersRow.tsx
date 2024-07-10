import {
	Option,
	OptionAvatar,
	OptionColumn,
	OptionDescription,
	OptionMenu,
	OptionContent,
	Icon,
	IconButton,
	OptionSkeleton,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericMenu from '../../../../../components/GenericMenu/GenericMenu';
import { useOptionMenuVisibility } from '../../../../../hooks/useOptionMenuVisibility';
import { usePreventPropagation } from '../../../../../hooks/usePreventPropagation';

const ContactGroupMembersRow = ({ name, username = name, phone }) => {
	const t = useTranslation();
	const { optionMenuEvent, showMenu } = useOptionMenuVisibility();
	const preventPropagation = usePreventPropagation();

	const menuOptions = [
		{
			items: [
				{
					id: 'remove',
					content: t('Remove_from_group'),
					icon: 'cross',
					variant: 'danger',
				} as const,
			],
		},
	];

	return (
		<Option {...optionMenuEvent}>
			<OptionAvatar>
				<UserAvatar username={username || ''} size='x28' />
			</OptionAvatar>
			<OptionContent>
				{name} {phone && <OptionDescription>({phone})</OptionDescription>}
			</OptionContent>
			<OptionMenu onClick={preventPropagation}>
				{showMenu ? <GenericMenu tiny detached sections={menuOptions} title={t('More')} /> : <IconButton tiny icon='kebab' />}
			</OptionMenu>
		</Option>
	);
};

export default ContactGroupMembersRow;
