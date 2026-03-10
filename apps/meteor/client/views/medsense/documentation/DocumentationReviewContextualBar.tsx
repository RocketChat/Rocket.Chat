import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useRoom } from '../../room/contexts/RoomContext';
import { popMedsenseDocumentationReturnTarget } from '../../room/hooks/useMedsenseDocumentationHandoff';
import { DocumentationReviewScreen } from './DocumentationReviewPage';

const DocumentationReviewContextualBar = () => {
	const { closeTab, openTab, context } = useRoomToolbox();
	const room = useRoom();

	if (!context || !room?._id) {
		return null;
	}

	const handleClose = () => {
		const { returnTab, returnContext } = popMedsenseDocumentationReturnTarget(room._id);
		if (returnTab && returnContext) {
			openTab(returnTab, returnContext);
			return;
		}

		closeTab();
	};

	return <DocumentationReviewScreen embedded interventionId={context} roomId={room._id} onClose={handleClose} />;
};

export default DocumentationReviewContextualBar;
