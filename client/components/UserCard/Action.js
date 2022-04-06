import { ActionButton } from '@rocket.chat/fuselage';
import React from 'react';

/**
 * @param {Object} props
 * @param {string=} props.label
 * @param {string=} props.icon
 */
const Action = ({ label, ...props }) => <ActionButton small title={label} {...props} mi='x2' />;

export default Action;
