import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import MessageToolbarItem from '../../MessageToolbarItem';
import { usePermalinkAction } from '../../usePermalinkAction';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

type PermalinkMessageActionProps = {
    message: IMessage;
    room: IRoom; // kept for parity with other actions, currently unused
    subscription: ISubscription | undefined; // kept for parity with other actions, currently unused
};

const PermalinkMessageAction = ({ message }: PermalinkMessageActionProps): ReactElement | null => {
    const { t } = useTranslation();
    const permalinkAction = usePermalinkAction(message, {
        id: 'permalink',
        context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
        order: 5,
    });

    if (!permalinkAction) {
        return null;
    }

    const encrypted = isE2EEMessage(message);

    return (
        <MessageToolbarItem
            id={permalinkAction.id}
            icon={permalinkAction.icon}
            title={encrypted ? t('Action_not_available_encrypted_content', { action: t('Copy_link') }) : t('Copy_link')}
            disabled={encrypted}
            qa='permalink'
            onClick={permalinkAction.action}
        />
    );
};

export default PermalinkMessageAction;
