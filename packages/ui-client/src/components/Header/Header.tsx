import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';

import HeaderDivider from './HeaderDivider';

const Header: FC<ComponentProps<typeof Box>> = (props) => {
	const { isMobile } = useLayout();

	return (
		<Box rcx-room-header is='header' display='flex' justifyContent='center' flexDirection='column' overflow='hidden' flexShrink={0}>
			<Box
				pi={isMobile ? 'x12' : 'x24'}
				height='x44'
				display='flex'
				flexGrow={1}
				justifyContent='center'
				alignItems='center'
				overflow='hidden'
				flexDirection='row'
				bg='room'
				{...props}
			/>
			<HeaderDivider />
		</Box>
	);
};

export default Header;
