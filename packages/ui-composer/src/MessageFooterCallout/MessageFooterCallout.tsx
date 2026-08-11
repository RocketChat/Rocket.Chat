import { Box } from '@rocket.chat/fuselage';
import type { ElementType, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export type MessageFooterCalloutProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: ElementType<any>;
	variant?: 'default' | 'error';
	dashed?: boolean;
} & RefAttributes<HTMLElement>;

const MessageFooterCallout = ({ dashed, ref, ...props }: MessageFooterCalloutProps) => {
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
			padding={8}
			marginBlockEnd={24}
			backgroundColor='surface-tint'
			alignItems='center'
			minHeight='x48'
			justifyContent='center'
			color='default'
			{...props}
		/>
	);
};

export default MessageFooterCallout;
