import { cx } from '../../helpers/composeClassNames';
import { ItemActions, type ItemActionsProps } from '../Item';

export type OptionInputProps = Omit<ItemActionsProps, 'reveal'>;

const OptionInput = ({ className, ...props }: OptionInputProps) => (
	<ItemActions {...props} className={cx('rcx-option__input', className)} />
);

export default OptionInput;
