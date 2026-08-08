import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type UserCardActionProps = { label?: ReactNode } & ComponentProps<typeof Button>;

const UserCardAction = ({ label, ...props }: UserCardActionProps) => (
	<Button small flexGrow={1} flexShrink={1} flexBasis={0} {...props}>
		{label}
	</Button>
);

export default UserCardAction;
