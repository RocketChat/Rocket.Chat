import './UiKitElementWrapper.scss';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const ElementWrapper = (props: ComponentProps<typeof Box>): ReactElement => (
  <Box className={'uikit-element-wrapper'} {...props} />
);

export default ElementWrapper;
