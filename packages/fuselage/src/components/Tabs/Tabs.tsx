import { Box, type BoxProps } from '../Box';

export type TabsProps = BoxProps & { divider?: boolean };

/**
 * Tabs is a component to navigate around the UI using buttons arranged together with the selected tab highlighted.
 */
function Tabs({ children, divider = true, ...props }: TabsProps) {
	return (
		<Box is='div' rcx-tabs rcx-tabs--with-divider={divider} {...props}>
			<Box is='div' rcx-tabs__scroll-box>
				<Box is='div' rcx-tabs__wrapper role='tablist'>
					{children}
				</Box>
			</Box>
		</Box>
	);
}

export default Tabs;
