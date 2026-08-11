import type { IconButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';

export type UserCardActionProps = IconButtonProps;

const UserCardAction = ({ label, icon, ...props }: UserCardActionProps) => <IconButton icon={icon} small title={label} {...props} />;

export default UserCardAction;
