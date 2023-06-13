import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

const ToneSelectorWrapper = ({ caption, children, ...props }: { caption: string } & Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => {
	return (
		<Box {...props} display='flex' alignItems='center'>
			<Box fontScale='c2'>{caption}</Box>
			{children}
		</Box>
	);
};

export default ToneSelectorWrapper;
