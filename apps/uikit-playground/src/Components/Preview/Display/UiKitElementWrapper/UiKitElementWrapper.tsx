import './UiKitElementWrapper.scss';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type ElementWrapperProps = BoxProps;

const ElementWrapper = (props: ElementWrapperProps) => <Box className='uikit-element-wrapper' {...props} />;

export default ElementWrapper;
