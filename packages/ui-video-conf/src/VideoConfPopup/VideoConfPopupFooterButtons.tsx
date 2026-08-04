import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type VideoConfPopupFooterButtonsProps = ComponentProps<typeof ButtonGroup>;

const VideoConfPopupFooterButtons = (props: VideoConfPopupFooterButtonsProps) => <ButtonGroup stretch {...props} />;

export default VideoConfPopupFooterButtons;
