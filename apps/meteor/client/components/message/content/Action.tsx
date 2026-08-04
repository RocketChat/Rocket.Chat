import type { IconButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';

export type ActionProps = IconButtonProps & { icon: string };

const Action = (props: ActionProps) => <IconButton marginInline={2} mini {...props} />;

export default Action;
