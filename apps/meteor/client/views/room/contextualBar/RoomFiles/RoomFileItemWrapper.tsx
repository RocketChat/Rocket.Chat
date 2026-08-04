import type { IUploadWithUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

const customClass = css`
	&:hover {
		cursor: pointer;
		background: ${Palette.surface['surface-hover']};
	}
`;

export type RoomFileItemWrapperProps = BoxProps & { item: IUploadWithUser } & RefAttributes<HTMLDivElement>;

const RoomFileItemWrapper = ({ item, ref, ...props }: RoomFileItemWrapperProps) => {
	return (
		<Box
			ref={ref}
			role='listitem'
			aria-label={item.name}
			display='flex'
			paddingBlock={12}
			paddingInline={24}
			borderRadius={4}
			className={customClass}
			{...props}
		/>
	);
};

export default RoomFileItemWrapper;
