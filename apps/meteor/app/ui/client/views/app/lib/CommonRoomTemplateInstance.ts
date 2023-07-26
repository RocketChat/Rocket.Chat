import type { ContextType } from 'react';

import type { ChatContext } from '../../../../../../client/views/room/contexts/ChatContext';
import type { ToolboxContextValue } from '../../../../../../client/views/room/contexts/ToolboxContext';

export type CommonRoomTemplateInstance = {
	data: {
		rid: string;
		tabBar: ToolboxContextValue;
		chatContext: ContextType<typeof ChatContext>;
	};
};
