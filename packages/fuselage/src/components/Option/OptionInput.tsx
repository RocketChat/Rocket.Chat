import { cx } from '../../helpers/composeClassNames';
import { ItemActions, type ItemActionsProps } from '../Item';
import { wrapText } from '../Item/wrapText';

export type OptionInputProps = Omit<ItemActionsProps, 'reveal' | 'justify'>;

const OptionInput = ({ className, children, ...props }: OptionInputProps) => (
	<ItemActions {...props} justify='end' className={cx('rcx-option__input', className)}>
		{wrapText(children)}
	</ItemActions>
);

export default OptionInput;
