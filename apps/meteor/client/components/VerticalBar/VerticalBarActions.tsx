import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo } from 'react';

const VerticalBarActions = (props: ComponentProps<typeof ButtonGroup>): ReactElement => <ButtonGroup {...props} />;

export default memo(VerticalBarActions);
