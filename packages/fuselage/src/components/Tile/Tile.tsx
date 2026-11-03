import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

export type TileProps = ElementProps<HTMLElement> & {
	elevation?: BoxProps['elevation'];
	/** Drops the default padding, for a surface whose content brings its own. */
	flush?: boolean;
};

function Tile({ elevation = '1', flush, ...props }: TileProps) {
	return <Box rcx-tile rcx-tile--elevation={elevation} padding={flush ? undefined : 16} {...props} />;
}

export default Tile;
