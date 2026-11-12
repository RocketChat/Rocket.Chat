import MessageReaction from './MessageReaction';
import { cx } from '../../../helpers/composeClassNames';
import type { DivActionAttributes } from '../../../types/ElementAttributes';
import { Icon } from '../../Icon';

export type MessageReactionActionProps = DivActionAttributes;

const MessageReactionAction = ({ className, ...props }: MessageReactionActionProps) => (
	<MessageReaction {...props} className={cx('rcx-message-reactions__reaction--action', className)}>
		<Icon name='emoji-plus' size='x16' />
	</MessageReaction>
);

export default MessageReactionAction;
