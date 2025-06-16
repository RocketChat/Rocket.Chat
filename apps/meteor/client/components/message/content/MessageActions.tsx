import type { IMessage } from '@rocket.chat/core-typings';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import MessageAction from './actions/MessageAction';
import { actionLinks } from '../../../lib/actionLinks';

type MessageActionOptions = {
	icon: IconName;
	i18nLabel?: TranslationKey;
	label?: string;
	methodId: string;
	runAction?: (action: string) => () => void;
	actionLinksAlignment?: string;
};

type MessageActionsProps = {
	message: IMessage;
	actions: MessageActionOptions[];
};

const MessageActions = ({ message, actions }: MessageActionsProps): ReactElement => {
	const runAction = useEffectEvent((action: string) => () => {
		actionLinks.run(action, message);
	});

	const alignment = actions[0]?.actionLinksAlignment || 'center';

	return (
		<Box display='flex' mb={4} mi={-4} width='full' justifyContent={alignment}>
			<ButtonGroup align='center'>
				{actions.map((action, key) => (
					<MessageAction key={key} runAction={runAction} {...action} />
				))}
			</ButtonGroup>
		</Box>
	);
};

export default MessageActions;
