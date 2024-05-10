import { AnimatedVisibility, Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

type PageFooterProps = { isDirty: boolean } & ComponentProps<typeof Box>;

const PageFooter: FC<PageFooterProps> = ({ children, isDirty, ...props }) => {
	return (
		<AnimatedVisibility visibility={isDirty ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}>
			<Box elevation='1' borderWidth={0} borderColor='transparent' minHeight='x64' pb={8} {...props}>
				<Box
					height='100%'
					marginInline={24}
					display='flex'
					flexDirection='row'
					flexWrap='wrap'
					alignItems='center'
					justifyContent='end'
					color='default'
					{...props}
				>
					{children}
				</Box>
			</Box>
		</AnimatedVisibility>
	);
};

export default PageFooter;
