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
		scope: 'department',
	},
	handlers: {
		handleShortcut: () => {},
		handleTags: () => {},
		handleDepartment: () => {},
	},
};

const errors = {};

const radioHandlers = {
	setPublic: () => {},
	setDepartment: () => {},
	setPrivate: () => {},
};

export const CreateCannedResponse = () => (
	<CreateCannedResponseModal
		isManager
		values={form.values}
		handlers={form.handlers}
		errors={errors}
		hasUnsavedChanges
		radioHandlers={radioHandlers}
		radioDescription='Anyone in the selected department can access this canned response'
		onClose={() => {}}
		onSave={() => {}}
		onPreview={() => {}}
	/>
);
