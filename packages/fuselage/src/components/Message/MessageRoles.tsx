import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import ItemRow from '../Item/ItemRow.js';

export type MessageRolesProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageRoles = ({ className, ...props }: MessageRolesProps) => (
	<ItemRow {...props} className={cx('rcx-message-header__roles', className)} />
);

export default MessageRoles;
