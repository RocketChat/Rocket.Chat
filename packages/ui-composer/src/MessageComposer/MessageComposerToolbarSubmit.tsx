import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerToolbarSubmit = (props: ComponentProps<typeof ButtonGroup>): ReactElement => <ButtonGroup small {...props} />;

export default MessageComposerToolbarSubmit;
