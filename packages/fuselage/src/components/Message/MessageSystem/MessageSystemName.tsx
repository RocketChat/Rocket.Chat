import { cx } from '../../../helpers/composeClassNames';
import type { MessageNameProps } from '../MessageName';

export type MessageSystemNameProps = MessageNameProps;

const MessageSystemName = ({ className, ...props }: MessageSystemNameProps) => (
	<span {...props} className={cx('rcx-message-system__name', className)} />
);

export default MessageSystemName;
