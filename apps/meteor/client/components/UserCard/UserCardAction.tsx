import { IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

type UserCardActionProps = ComponentProps<typeof IconButton>;

const UserCardAction = ({ icon, ...props }: UserCardActionProps): ReactElement => <IconButton icon={icon} small {...props} />;

export default UserCardAction;
