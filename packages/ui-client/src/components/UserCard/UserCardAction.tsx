import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type UserCardActionProps = { label?: ReactNode } & ComponentProps<typeof Button>;

// Actions keep their icon next to the label — the redesign added the label,
// it did not drop the icon. Each action brings its own (data-driven per action).
const UserCardAction = ({ label, icon, ...props }: UserCardActionProps) => (
	<Button icon={icon} small flexGrow={1} flexShrink={1} flexBasis={0} {...props}>
		{label}
	</Button>
);

export default UserCardAction;
