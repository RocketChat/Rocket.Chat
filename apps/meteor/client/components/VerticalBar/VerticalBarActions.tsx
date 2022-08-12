import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { memo, ReactElement, ComponentProps } from 'react';

const VerticalBarActions = (props: ComponentProps<typeof ButtonGroup>): ReactElement => <ButtonGroup medium {...props} />;

export default memo(VerticalBarActions);
