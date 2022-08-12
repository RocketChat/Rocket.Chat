import { IconButton } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

type UserCardActionProps = ComponentProps<typeof IconButton>;

const UserCardAction = ({ label, icon, ...props }: UserCardActionProps): ReactElement => (
	<IconButton icon={icon} small title={label} {...props} mi='x2' />
);

export default UserCardAction;
