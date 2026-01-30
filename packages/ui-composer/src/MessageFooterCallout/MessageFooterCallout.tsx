import { Box } from '@rocket.chat/fuselage';
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

const MessageFooterCallout = forwardRef<
	HTMLElement,
	Omit<HTMLAttributes<HTMLElement>, 'is'> & {
		children: ReactNode;
		is?: ElementType<any>;
		variant?: 'default' | 'error';
		dashed?: boolean;
	}
>(function MessageFooterCallout({ dashed, ...props }, ref): ReactElement {
	return (
		<Box
			ref={ref}
			{...(dashed && {
				borderStyle: 'dashed',
			})}
			display='flex'
			borderWidth={2}
			borderColor='light'
			borderRadius='x4'
			p={8}
			mbe={24}
			backgroundColor='surface-tint'
			alignItems='center'
			minHeight='x48'
			justifyContent='center'
			color='default'
			{...props}
		/>
	);
});

export default MessageFooterCallout;
