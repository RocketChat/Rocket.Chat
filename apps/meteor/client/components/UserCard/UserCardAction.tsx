import { IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

type UserCardActionProps = ComponentProps<typeof IconButton>;

const UserCardAction = ({ label, icon, ...props }: UserCardActionProps): ReactElement => (
	<IconButton icon={icon} small title={label} {...props} />
);

export default UserCardAction;
