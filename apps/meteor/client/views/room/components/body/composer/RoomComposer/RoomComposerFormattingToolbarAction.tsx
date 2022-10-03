import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { FormattingButton } from '../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { useKeyboardShortcuts } from '../hooks/useRoomComposerShortcut';
import { useRoomComposerHandleFormattingClick } from './hooks/useRoomComposerHandleFormattingClick';

const RoomComposerFormattingToolbarAction = ({
	action,
	textareaRef,
}: {
	action: Required<FormattingButton>;
	textareaRef: React.RefObject<HTMLTextAreaElement>;
}): ReactElement => {
	const t = useTranslation();

	const handleActionClick = useRoomComposerHandleFormattingClick(textareaRef);

	useKeyboardShortcuts(action.command, handleActionClick(action));

	return (
		<MessageComposerAction
			key={action.icon}
			icon={action.icon}
			aria-keyshortcuts={action.command}
			title={t.has(action.label) ? t(action.label) : undefined}
			onClick={handleActionClick(action)}
		/>
	);
};

export default memo(RoomComposerFormattingToolbarAction);
