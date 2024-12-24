import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
import MessageToolbarItem from '../../MessageToolbarItem';

type JumpToMessageActionProps = {
	id: 'jump-to-message' | 'jump-to-pin-message' | 'jump-to-star-message';
	message: IMessage;
};

const JumpToMessageAction = ({ id, message }: JumpToMessageActionProps) => {
	const { t } = useTranslation();

	return (
		<MessageToolbarItem
			id={id}
			icon='jump'
			title={t('Jump_to_message')}
			qa='Jump_to_message'
			onClick={() => {
				setMessageJumpQueryStringParameter(message._id);
			}}
		/>
	);
};

export default JumpToMessageAction;
