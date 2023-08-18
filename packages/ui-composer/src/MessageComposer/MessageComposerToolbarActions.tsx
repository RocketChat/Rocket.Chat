import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const MessageComposerToolbarActions = ({ ...props }): ReactElement => <ButtonGroup role='toolbar' small mis={4} {...props} />;

export default MessageComposerToolbarActions;
