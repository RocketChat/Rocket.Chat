import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useMessageActions } from '../../../list/MessageListContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type JumpToMessageActionProps = {
	id: 'jump-to-message' | 'jump-to-pin-message' | 'jump-to-star-message';
	message: IMessage;
};

const JumpToMessageAction = ({ id, message }: JumpToMessageActionProps) => {
	const { t } = useTranslation();
	const actions = useMessageActions();

	return <MessageToolbarItem id={id} icon='jump' title={t('Jump_to_message')} onClick={() => actions.jumpTo(message)} />;
};

export default JumpToMessageAction;
