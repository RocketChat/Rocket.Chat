import { Box } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

const MessageFooterCallout = forwardRef<
	HTMLElement,
	Omit<HTMLAttributes<HTMLElement>, 'is'> & {
		children: ReactNode;
		is?: React.ElementType<any>;
		variant?: 'default' | 'error';
		dashed?: boolean;
	}
>(
	({ dashed, ...props }, ref): ReactElement => (
		<Box
			ref={ref}
			{...(dashed && {
				borderStyle: 'dashed',
			})}
			display='flex'
			borderWidth={2}
			borderColor='light'
			borderRadius='x4'
			p='x8'
			backgroundColor='surface-tint'
			alignItems='center'
			minHeight='x48'
			justifyContent='center'
			{...props}
		/>
	),
);

export default MessageFooterCallout;
