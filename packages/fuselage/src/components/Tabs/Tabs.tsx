import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TabsProps = ElementProps<HTMLDivElement> & {
	/** Draws a line under the tabs, separating them from the content below. */
	divider?: boolean;
	/** Grows the items to fill the whole width. */
	stretch?: boolean;
};

/**
 * Lets the user move back and forth between groups of related content on the same page, one group at a time.
 */
function Tabs({ children, divider = true, stretch, ...props }: TabsProps) {
	return (
		<Box is='div' rcx-tabs rcx-tabs--with-divider={divider} rcx-tabs--stretch={stretch} {...props}>
			<Box is='div' rcx-tabs__scroll-box>
				<Box is='div' rcx-tabs__wrapper role='tablist'>
					{children}
				</Box>
			</Box>
		</Box>
	);
}

export default Tabs;
