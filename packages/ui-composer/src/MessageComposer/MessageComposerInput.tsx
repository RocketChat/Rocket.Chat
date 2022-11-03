import { TextInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerInput = (props: ComponentProps<typeof TextInput>): ReactElement => <TextInput {...props} borderWidth={0} />;

export default MessageComposerInput;
