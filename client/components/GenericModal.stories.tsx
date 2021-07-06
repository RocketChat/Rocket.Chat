import { Story } from '@storybook/react';
import React from 'react';

import GenericModal, { GenericModalDoNotAskAgain } from './GenericModal';

export default {
	title: 'components/GenericModal',
	component: GenericModal,
};

const func = (): void => undefined;
const defaultProps = { onClose: func, onConfirm: func, onCancel: func };

export const _default: Story = () => <GenericModal {...defaultProps} />;
export const Danger: Story = () => <GenericModal {...defaultProps} variant='danger' />;
export const Warning: Story = () => <GenericModal {...defaultProps} variant='warning' />;
export const Success: Story = () => <GenericModal {...defaultProps} variant='success' />;
export const WithDontAskAgain: Story = () => (
	<GenericModalDoNotAskAgain dontAskAgain={{ action: '', label: '' }} {...defaultProps} />
);
