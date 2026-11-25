import { GenericMenu, HeaderToolbarAction } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

import type { VideoCallMenuSections } from './buildVideoCallMenuSections';

type GenericMenuProps = ComponentProps<typeof GenericMenu>;

export type VideoCallMenuProps = Pick<GenericMenuProps, 'title' | 'disabled' | 'className'> & {
	sections: VideoCallMenuSections;
	icon?: GenericMenuProps['icon'];
};

/** The room header's video call button; it stays disabled while there is nothing in its menu. */
const VideoCallMenu = ({ sections, title, disabled, className, icon = 'video' }: VideoCallMenuProps) => (
	<GenericMenu
		button={<HeaderToolbarAction icon={icon} />}
		title={title}
		icon={icon}
		disabled={disabled || sections.length === 0}
		className={className}
		sections={sections}
		placement='bottom-start'
	/>
);

export default VideoCallMenu;
