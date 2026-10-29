import { cx } from '../../helpers/composeClassNames';
import { ItemDescription, type ItemDescriptionProps } from '../Item';

export type OptionDescriptionProps = Omit<ItemDescriptionProps, 'inline'>;

const OptionDescription = ({ className, ...props }: OptionDescriptionProps) => (
	<ItemDescription inline {...props} className={cx('rcx-option__description', className)} />
);

export default OptionDescription;
