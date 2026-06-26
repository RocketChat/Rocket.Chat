import { Divider } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type HorizontalDividerProps = Omit<ComponentProps<typeof Divider>, 'vertical'>;

const HorizontalDivider = (props: HorizontalDividerProps) => <Divider {...props} vertical={false} />;

export default HorizontalDivider;
