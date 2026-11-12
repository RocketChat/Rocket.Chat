import { cx } from '../../helpers/composeClassNames';
import { ItemMedia } from '../Item';
import type { ItemPartAttributes } from '../Item/types';
import { wrapText } from '../Item/wrapText';

export type OptionColumnProps = ItemPartAttributes;

/**
 * A slot of at least 20px for a status, an emoji or a short label. Empty, it lines up rows with and without icons.
 */
const OptionColumn = ({ className, children, ...props }: OptionColumnProps) => (
	<ItemMedia {...props} variant='slot' className={cx('rcx-option__column', className)}>
		{wrapText(children)}
	</ItemMedia>
);

export default OptionColumn;
