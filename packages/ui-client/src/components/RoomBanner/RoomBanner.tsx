import { css } from '@rocket.chat/css-in-js';
import { Box, Divider, Palette } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import { ComponentProps } from 'react';

const clickable = css`
	cursor: pointer;
	&:focus-visible {
		outline: ${Palette.stroke['stroke-highlight']} solid 1px;
	}
`;

export const RoomBanner = ({ onClick, className, ...props }: ComponentProps<typeof Box>) => {
	const { isMobile } = useLayout();

	return (
		<>
			<Box
				pi={isMobile ? 'x12' : 'x24'}
				height='x44'
				w='full'
				display='flex'
				flexGrow={1}
				justifyContent='center'
				alignItems='center'
				overflow='hidden'
				flexDirection='row'
				bg='room'
				className={[onClick && clickable, ...(Array.isArray(className) ? className : [className])]}
				onClick={onClick}
				tabIndex={onClick ? 0 : -1}
				role={onClick ? 'button' : 'banner'}
				is={onClick ? 'button' : 'div'}
				{...props}
			/>
			<Divider mbs={-2} mbe={0} />
		</>
	);
};
