import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemRow from '../Item/ItemRow';

export type MessageRolesProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageRoles = ({ className, ...props }: MessageRolesProps) => (
	<ItemRow {...props} className={cx('rcx-message-header__roles', className)} />
);

export default MessageRoles;
