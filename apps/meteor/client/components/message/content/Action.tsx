import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ActionProps = ComponentProps<typeof IconButton> & { icon: string };

const Action = (props: ActionProps) => <IconButton marginInline={2} mini {...props} />;

export default Action;
