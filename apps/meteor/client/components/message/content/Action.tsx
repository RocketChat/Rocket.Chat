import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

type ActionProps = ComponentProps<typeof IconButton> & { icon: string };

const Action = (props: ActionProps): ReactElement => <IconButton mi={2} mini {...props} />;

export default Action;
