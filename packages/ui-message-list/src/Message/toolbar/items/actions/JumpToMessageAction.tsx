import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useMessageNavigation } from '../../../contexts/MessageNavigationContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type JumpToMessageActionProps = {
	id: 'jump-to-message' | 'jump-to-pin-message' | 'jump-to-star-message';
	message: IMessage;
};

const JumpToMessageAction = ({ id, message }: JumpToMessageActionProps) => {
	const { jumpToMessage } = useMessageNavigation();
	const { t } = useTranslation();

	return <MessageToolbarItem id={id} icon='jump' title={t('Jump_to_message')} onClick={() => jumpToMessage(message)} />;
};

export default JumpToMessageAction;
