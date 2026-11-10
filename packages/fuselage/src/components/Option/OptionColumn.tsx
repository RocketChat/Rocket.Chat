import { cx } from '../../helpers/composeClassNames';
import { ItemMedia, type ItemMediaProps } from '../Item';

export type OptionColumnProps = Omit<ItemMediaProps, 'variant'>;

/**
 * A slot of at least 20px for a status, an emoji or a short label. Empty, it lines up rows with and without icons.
 */
const OptionColumn = ({ className, ...props }: OptionColumnProps) => (
	<ItemMedia {...props} className={cx('rcx-option__column', className)} />
);

export default OptionColumn;
