import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentAction: FC<ComponentProps<typeof IconButton> & { icon: string }> = (props) => <IconButton mi='x2' mini {...props} />;

export default AttachmentAction;
