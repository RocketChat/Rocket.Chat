import { cx } from '../../helpers/composeClassNames';
import { ItemMedia } from '../Item';
import type { ItemPartAttributes } from '../Item/types';
import { wrapText } from '../Item/wrapText';

export type OptionAvatarProps = ItemPartAttributes;

const OptionAvatar = ({ className, children, ...props }: OptionAvatarProps) => (
	<ItemMedia {...props} className={cx('rcx-option__avatar', className)}>
		{wrapText(children)}
	</ItemMedia>
);

export default OptionAvatar;
