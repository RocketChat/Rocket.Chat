import type { ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type DividerProps = ElementProps<HTMLElement> & {
	variation?: 'danger' | 'light';
	children?: ReactNode;
	vertical?: boolean;
	/** Removes the divider's own margin, leaving the spacing to its container. */
	flush?: boolean;
	/** Uses a 4px inline margin on a vertical divider instead of 8px. */
	small?: boolean;
	/** Makes a vertical divider as tall as its container instead of 20px. */
	stretch?: boolean;
};

const Divider = ({ variation, children, vertical, flush, small, stretch, ...props }: DividerProps) => {
	if (!children) {
		return (
			<Box
				is='hr'
				rcx-divider
				rcx-divider--vertical={vertical}
				rcx-divider--small={vertical && small}
				rcx-divider--stretch={vertical && stretch}
				rcx-divider--flush={flush}
				rcx-divider--danger={variation === 'danger'}
				rcx-divider--light={variation === 'light'}
				{...props}
			/>
		);
	}
	return (
		<Box rcx-message-divider rcx-divider--labelled role='separator' {...props}>
			<div className='rcx-divider__bar' />
			<div className='rcx-divider__wrapper'>{children}</div>
			<div className='rcx-divider__bar' />
		</Box>
	);
};

export default Divider;
