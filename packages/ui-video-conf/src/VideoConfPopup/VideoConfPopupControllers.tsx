import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type VideoConfPopupControllersProps = ComponentProps<typeof ButtonGroup>;

const VideoConfPopupControllers = (props: VideoConfPopupControllersProps) => <ButtonGroup {...props} />;

export default VideoConfPopupControllers;
