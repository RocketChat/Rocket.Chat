import { ItemDivider } from '../Item';
import { frameStyle, sidebarColorStrokeExtraLight } from './sidebarStyles';

export const SidebarDivider = () => (
	<ItemDivider role='separator' {...frameStyle({ borderColor: sidebarColorStrokeExtraLight })} className='rcx-sidebar--divider' />
);
