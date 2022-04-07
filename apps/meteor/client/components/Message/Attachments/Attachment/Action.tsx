import { ActionButton } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Action: FC<ComponentProps<typeof ActionButton> & { icon: string }> = (props) => <ActionButton mi='x2' mini ghost {...props} />;

export default Action;
