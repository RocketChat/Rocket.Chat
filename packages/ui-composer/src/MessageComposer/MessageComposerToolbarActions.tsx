import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerToolbarActions = (props: ComponentProps<typeof ButtonGroup>): ReactElement => (
	<ButtonGroup role='toolbar' small {...props} />
);

export default MessageComposerToolbarActions;
