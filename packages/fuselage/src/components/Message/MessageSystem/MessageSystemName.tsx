import { cx } from '../../../helpers/composeClassNames.js';
import type { MessageNameProps } from '../MessageName.js';

export type MessageSystemNameProps = MessageNameProps;

const MessageSystemName = ({ className, ...props }: MessageSystemNameProps) => (
	<span {...props} className={cx('rcx-message-system__name', className)} />
);

export default MessageSystemName;
