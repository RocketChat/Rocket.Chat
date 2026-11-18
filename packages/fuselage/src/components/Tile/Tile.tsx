import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

export type TileProps = ElementProps<HTMLElement> & {
	/** How far the tile stands out from the page, from `0` (flat) to `2`. */
	elevation?: BoxProps['elevation'];
	/** Drops the default padding, for a surface whose content brings its own. */
	flush?: boolean;
};

/** A raised surface that sets a block of content apart from the page. */
function Tile({ elevation = '1', flush, ...props }: TileProps) {
	return <Box rcx-tile rcx-tile--elevation={elevation} rcx-tile--flush={flush} {...props} />;
}

export default Tile;
