import type { ButtonProps } from '@rocket.chat/fuselage';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { MouseEvent, RefAttributes } from 'react';

import type { RadioDropDownGroup } from '../../definitions/RadioDropDownDefinitions';

// `ref` is omitted from Button's props so this component can narrow it to HTMLElement,
// matching what forwardRef's PropsWithoutRef did.
export type RadioDownAnchorProps = {
	onClick: (event: MouseEvent<HTMLElement>) => void;
	group: RadioDropDownGroup;
} & Omit<ButtonProps, 'onClick' | 'ref'> &
	RefAttributes<HTMLElement>;

const RadioDownAnchor = ({ onClick, group, ref, ...props }: RadioDownAnchorProps) => {
	const selected = group?.items.find((item) => item.checked)?.label;

	return (
		<Box
			is='button'
			ref={ref}
			onClick={onClick}
			alignItems='center'
			backgroundColor='light'
			borderColor='light'
			borderRadius='x4'
			borderWidth='x1'
			color='secondary-info'
			display='flex'
			flexGrow={1}
			flexShrink={1}
			fontScale='p2'
			height='x40'
			justifyContent='space-between'
			minWidth='x144'
			paddingInlineEnd={10}
			paddingInlineStart={14}
			rcx-input-box
			{...props}
		>
			{selected}
			<Icon name='chevron-down' size='x20' />
		</Box>
	);
};

export default RadioDownAnchor;
