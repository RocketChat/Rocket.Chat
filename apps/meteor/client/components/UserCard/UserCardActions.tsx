import { useToolbar } from '@react-aria/toolbar';
import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';
import { useRef } from 'react';

export type UserCardActionsProps = ButtonGroupProps;

const UserCardActions = (props: UserCardActionsProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar(props, ref);

	return <ButtonGroup ref={ref} small {...toolbarProps} {...props} />;
};

export default UserCardActions;
