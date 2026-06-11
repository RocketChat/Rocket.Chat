import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type ActionProps = ComponentProps<typeof IconButton> & { icon: string };

const Action = (props: ActionProps) => <IconButton mi={2} mini {...props} />;

export default Action;
