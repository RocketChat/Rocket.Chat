import type { Button } from '@rocket.chat/fuselage';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, SetStateAction } from 'react';
import { forwardRef } from 'react';

import type { RadioDropDownGroup } from '../../definitions/RadioDropDownDefinitions';

type RadioDropdownAnchorProps = {
	onClick: (forcedValue?: SetStateAction<boolean> | undefined) => void;
	group: RadioDropDownGroup;
} & Omit<ComponentProps<typeof Button>, 'onClick'>;

const RadioDownAnchor = forwardRef<HTMLElement, RadioDropdownAnchorProps>(function SortDropDownAnchor({ onClick, group, ...props }, ref) {
	const selected = group?.items.find((item) => item.checked)?.label;

	return (
		<Box
			is='button'
			ref={ref}
			onClick={onClick as any}
			alignItems='center'
			bg='light'
			borderColor='light'
			borderRadius='x4'
			borderWidth='x1'
			color='secondary-info'
			display='flex'
			flexGrow={1}
			flexShrink={1}
			fontScale='p2'
			h='x40'
			justifyContent='space-between'
			minWidth='x144'
			pie={10}
			pis={14}
			rcx-input-box
			{...props}
		>
			{selected}
			<Icon name='chevron-down' size='x20' />
		</Box>
	);
});

export default RadioDownAnchor;
