import { useToolbar } from '@react-aria/toolbar';
import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import { useRef } from 'react';

type UserCardActionsProps = ComponentProps<typeof ButtonGroup>;

const UserCardActions = (props: UserCardActionsProps): ReactElement => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar(props, ref);

	return <ButtonGroup ref={ref} small {...toolbarProps} {...props} />;
};

export default UserCardActions;
