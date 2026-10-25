import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ActionProps = ComponentProps<typeof IconButton> & { icon: string };

const Action = (props: ActionProps) => <IconButton mini {...props} />;

export default Action;
