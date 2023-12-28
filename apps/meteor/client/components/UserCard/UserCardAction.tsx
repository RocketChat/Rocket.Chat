import { IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

type UserCardActionProps = ComponentProps<typeof IconButton>;

const UserCardAction = ({ label, icon, ...props }: UserCardActionProps): ReactElement => (
	<IconButton icon={icon} small title={label} {...props} mi={2} />
);

export default UserCardAction;
