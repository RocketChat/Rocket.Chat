import { css } from '@rocket.chat/css-in-js';
import { Box, Divider } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import { ComponentProps } from 'react';

export const RoomBanner = ({ onClick, className, ...props }: ComponentProps<typeof Box>) => {
	const { isMobile } = useLayout();

	const pointer = css`
		cursor: pointer;
	`;

	return (
		<>
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
				className={[onClick && pointer, className].filter(Boolean).join(' ')}
				onClick={onClick}
				{...props}
			/>
			<Divider mbs={-1} mbe={0} />
		</>
	);
};
