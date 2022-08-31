import { ButtonGroup } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

const ToolBox: FC<ComponentProps<typeof ButtonGroup>> = (props) => <ButtonGroup mi='x4' medium {...props} />;

export default ToolBox;
