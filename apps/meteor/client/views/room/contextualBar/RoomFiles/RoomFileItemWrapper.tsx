import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps, Ref } from 'react';
import { forwardRef } from 'react';

const customClass = css`
	&:hover {
		cursor: pointer;
		background: ${Palette.surface['surface-hover']};
	}
`;

type RoomFileItemWrapperProps = ComponentProps<typeof Box>;

const RoomFileItemWrapper = forwardRef(function RoomFileItemWrapper(props: RoomFileItemWrapperProps, ref: Ref<HTMLDivElement>) {
	return <Box ref={ref} display='flex' pb={12} pi={24} borderRadius={4} className={customClass} {...props} />;
});

export default RoomFileItemWrapper;
