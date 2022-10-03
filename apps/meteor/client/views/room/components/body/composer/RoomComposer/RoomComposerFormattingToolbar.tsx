import React, { memo, ReactElement } from 'react';

import RoomComposerFormattingToolbarAction from './RoomComposerFormattingToolbarAction';
import { useRoomComposerFormattingActions } from './hooks/useRoomComposerFormattingActions';

const RoomComposerFormattingToolbar = ({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement> }): ReactElement => {
	const formattingActions = useRoomComposerFormattingActions();

	if (!formattingActions.length) return <></>;

	return (
		<>
			{formattingActions.map((action) => (
				<RoomComposerFormattingToolbarAction key={action.label} action={action} textareaRef={textareaRef} />
			))}
		</>
	);
};

export default memo(RoomComposerFormattingToolbar);
