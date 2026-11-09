import type { ElementProps } from '../../types/ElementProps.js';
import { Box, type BoxProps } from '../Box/index.js';

export type TileProps = ElementProps<HTMLElement> & {
	elevation?: BoxProps['elevation'];
	/** Drops the default padding, for a surface whose content brings its own. */
	flush?: boolean;
};

function Tile({ elevation = '1', flush, ...props }: TileProps) {
	return <Box rcx-tile rcx-tile--elevation={elevation} rcx-tile--flush={flush} {...props} />;
}

export default Tile;
