import { type IMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getPermaLink } from '../../../../../lib/getPermaLink';
import ForwardMessageModal from '../../../../../views/room/modals/ForwardMessageModal';
import MessageToolbarItem from '../../MessageToolbarItem';

type ForwardMessageActionProps = {
	message: IMessage;
};

const ForwardMessageAction = ({ message }: ForwardMessageActionProps) => {
	const setModal = useSetModal();
	const { t } = useTranslation();

	const encrypted = isE2EEMessage(message);

	return (
		<MessageToolbarItem
			id='forward-message'
			icon='arrow-forward'
			title={encrypted ? t('Action_not_available_encrypted_content', { action: t('Forward_message') }) : t('Forward_message')}
			qa='Forward_message'
			disabled={encrypted}
			onClick={async () => {
				const permalink = await getPermaLink(message._id);
				setModal(
					<ForwardMessageModal
						message={message}
						permalink={permalink}
						onClose={() => {
							setModal(null);
						}}
					/>,
				);
			}}
		/>
	);
};

export default ForwardMessageAction;
