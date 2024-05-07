import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

const VideoConfPopupFooterButtons = (props: ComponentProps<typeof ButtonGroup>): ReactElement => <ButtonGroup stretch {...props} />;

export default VideoConfPopupFooterButtons;
