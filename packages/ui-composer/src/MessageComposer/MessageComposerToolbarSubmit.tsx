import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type MessageComposerToolbarSubmitProps = ComponentProps<typeof ButtonGroup>;

const MessageComposerToolbarSubmit = (props: MessageComposerToolbarSubmitProps) => <ButtonGroup small {...props} />;

export default MessageComposerToolbarSubmit;
