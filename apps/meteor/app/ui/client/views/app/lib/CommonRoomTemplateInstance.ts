import type { ContextType } from 'react';

import type { ToolboxContextValue } from '../../../../../../client/views/room/contexts/ToolboxContext';
import type { ChatContext } from '../../../../../../client/views/room/contexts/ChatContext';

export type CommonRoomTemplateInstance = {
	data: {
		rid: string;
		tabBar: ToolboxContextValue;
		chatContext: ContextType<typeof ChatContext>;
	};
};
