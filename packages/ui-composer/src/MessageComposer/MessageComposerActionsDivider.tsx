import { Divider } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerActionsDivider = (props: ComponentProps<typeof Divider>) => <Divider vertical small variation='light' {...props} />;

export default MessageComposerActionsDivider;
