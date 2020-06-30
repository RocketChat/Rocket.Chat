import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
// TODO fuselage
export const ActionButton = ({ icon, ...props }) => <Button {...props} square ghost small><Icon name={icon} size='x20'/></Button>;
