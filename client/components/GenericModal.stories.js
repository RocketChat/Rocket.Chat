import React from 'react';

import GenericModal, { GenericModalDoNotAskAgain } from './GenericModal';

export default {
	title: 'components/GenericModal',
	component: GenericModal,
};

const func = () => null;
const defaultProps = { onClose: func, onConfirm: func, onCancel: func };

export const _default = () => <GenericModal {...defaultProps} />;
export const Danger = () => <GenericModal {...defaultProps} variant='danger' />;
export const Warning = () => <GenericModal {...defaultProps} variant='warning' />;
export const Success = () => <GenericModal {...defaultProps} variant='success' />;
export const WithDontAskAgain = () => (
	<GenericModalDoNotAskAgain dontAskAgain={{ action: '', label: '' }} {...defaultProps} />
);
