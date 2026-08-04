import './UiKitElementWrapper.scss';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

const ElementWrapper = (props: BoxProps) => <Box className='uikit-element-wrapper' {...props} />;

export default ElementWrapper;
