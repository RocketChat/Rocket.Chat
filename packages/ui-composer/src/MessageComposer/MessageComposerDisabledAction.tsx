import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerDisabledAction = (props: ComponentProps<typeof Button>): ReactElement => <Button primary small mis='x8' {...props} />;

export default MessageComposerDisabledAction;
