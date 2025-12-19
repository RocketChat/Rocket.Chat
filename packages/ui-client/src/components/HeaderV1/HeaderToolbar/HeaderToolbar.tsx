import { useToolbar } from '@react-aria/toolbar';
import { ButtonGroup } from '@rocket.chat/fuselage';
import { type ComponentPropsWithoutRef, useRef } from 'react';

export type HeaderToolbarProps = ComponentPropsWithoutRef<typeof ButtonGroup>;

const HeaderToolbar = (props: HeaderToolbarProps) => {
	const ref = useRef(null);
	const { toolbarProps } = useToolbar(props, ref);

	return (
		<ButtonGroup role='toolbar' ref={ref} {...toolbarProps}>
			{props.children}
		</ButtonGroup>
	);
};

export default HeaderToolbar;
