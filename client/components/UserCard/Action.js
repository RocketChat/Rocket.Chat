import { ActionButton } from '@rocket.chat/fuselage';
import React from 'react';

const Action = ({ label, ...props }) => <ActionButton small title={label} {...props} mi='x2' />;

export default Action;
