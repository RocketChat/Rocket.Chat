import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { HTMLAttributes } from 'react';

export const RoomBannerContent = (props: Omit<HTMLAttributes<HTMLElement>, 'is'>) => (
	<Box
		fontScale='p2'
		p={4}
		flexGrow={1}
		withTruncatedText
		className={css`
			color: ${Palette.text['font-hint']};
		`}
		{...props}
	/>
);
