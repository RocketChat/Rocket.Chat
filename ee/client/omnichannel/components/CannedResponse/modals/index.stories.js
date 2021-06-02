import React from 'react';

import CreateCannedResponseModal from './CreateCannedResponse/CreateCannedResponseModal';

export default {
	title: 'omnichannel/CannedResponse/Modal',
	component: CreateCannedResponseModal,
};

const form = {
	values: {
		shortcut: 'test',
		tags: ['test'],
	},
	handlers: {
		shortcut: () => {},
		tags: () => {},
	},
	errors: '',
};

export const CreateCannedResponse = () => (
	<CreateCannedResponseModal
		isManager={true}
		form={form}
		onClose={() => {}}
		onSave={() => {}}
		onPreview={() => {}}
	/>
);
