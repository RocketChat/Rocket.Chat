import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';

export type MessageComposerToolbarSubmitProps = ButtonGroupProps;

const MessageComposerToolbarSubmit = (props: MessageComposerToolbarSubmitProps) => <ButtonGroup small {...props} />;

export default MessageComposerToolbarSubmit;
