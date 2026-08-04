import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';

export type VideoConfPopupFooterButtonsProps = ButtonGroupProps;

const VideoConfPopupFooterButtons = (props: VideoConfPopupFooterButtonsProps) => <ButtonGroup stretch {...props} />;

export default VideoConfPopupFooterButtons;
