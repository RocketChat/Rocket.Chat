import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const MessageComposerToolbarActions = ({ ...props }): ReactElement => <ButtonGroup mis='x4' {...props} />;

export default MessageComposerToolbarActions;
