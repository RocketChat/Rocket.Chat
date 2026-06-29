import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type UserCardActionProps = ComponentProps<typeof IconButton>;

const UserCardAction = ({ label, icon, ...props }: UserCardActionProps) => <IconButton icon={icon} small title={label} {...props} />;

export default UserCardAction;
