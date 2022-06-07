import { IconButton } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Action: FC<ComponentProps<typeof IconButton> & { icon: string }> = (props) => <IconButton mi='x2' mini {...props} />;

export default Action;
