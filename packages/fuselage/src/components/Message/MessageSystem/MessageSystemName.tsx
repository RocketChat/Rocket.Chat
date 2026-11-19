import { cx } from '../../../helpers/composeClassNames';
import type { MessageNameProps } from '../MessageName';

export type MessageSystemNameProps = MessageNameProps;

/**
 * The name of the user the event is about, in a system message.
 */
const MessageSystemName = ({ className, ...props }: MessageSystemNameProps) => (
	<span {...props} className={cx('rcx-message-system__name', className)} />
);

export default MessageSystemName;
