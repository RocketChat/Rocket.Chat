import { ButtonGroup } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';

const HeaderToolbox: FC<ComponentProps<typeof ButtonGroup>> = (props) => <ButtonGroup role='toolbar' mi='x4' {...props} />;

export default HeaderToolbox;
