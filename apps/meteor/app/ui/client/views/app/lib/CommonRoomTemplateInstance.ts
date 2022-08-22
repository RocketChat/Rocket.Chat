import type { ToolboxContextValue } from '../../../../../../client/views/room/lib/Toolbox/ToolboxContext';

export type CommonRoomTemplateInstance = Blaze.TemplateInstance<{
	rid: string;
	tabBar: ToolboxContextValue;
}> & {
	tabBar: ToolboxContextValue;
};
