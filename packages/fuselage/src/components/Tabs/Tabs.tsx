import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TabsProps = ElementProps<HTMLDivElement> & {
	divider?: boolean;
	/** Grows the items to fill the whole width. */
	stretch?: boolean;
};

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
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
