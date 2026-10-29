import type { CSSProperties, ReactNode } from 'react';

import { size as sizeToken } from '../../styleTokens';
import { Box } from '../Box';
import { PopoverSurface } from '../PopoverSurface';
import { Scrollable } from '../Scrollable';

export type OptionContainerProps = {
	/** The width of the list, as the control it opens from measures it. */
	width?: number | string;
	children?: ReactNode;
};

function OptionContainer({ width, children }: OptionContainerProps) {
	return (
		<div className='rcx-box rcx-box--full rcx-options'>
			<PopoverSurface elevation='1'>
				{/* A `Box`: `Scrollable` hands it its scroll styles through `BoxTransforms` */}
				<Scrollable vertical smooth>
					<Box rcx-options__list rcx-options__list--container style={{ '--rcx-options-width': sizeToken(width) } as CSSProperties}>
						{children}
					</Box>
				</Scrollable>
			</PopoverSurface>
		</div>
	);
}

export default OptionContainer;
