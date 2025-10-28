import type { IUploadWithUser } from '@rocket.chat/core-typings';
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

type RoomFileItemWrapperProps = ComponentProps<typeof Box> & { item: IUploadWithUser };

const RoomFileItemWrapper = forwardRef(function RoomFileItemWrapper(
	{ item, ...props }: RoomFileItemWrapperProps,
	ref: Ref<HTMLDivElement>,
) {
	return (
		<Box
			ref={ref}
			role='listitem'
			aria-label={item.name}
			display='flex'
			pb={12}
			pi={24}
			borderRadius={4}
			className={customClass}
			{...props}
		/>
	);
});

export default RoomFileItemWrapper;
