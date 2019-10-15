import React from 'react';

import { CommitSection } from './CommitSection';

export default {
	title: 'admin/info/CommitSection',
	component: CommitSection,
};

const info = {
	commit: {
		hash: 'info.commit.hash',
		date: 'info.commit.date',
		branch: 'info.commit.branch',
		tag: 'info.commit.tag',
		author: 'info.commit.author',
		subject: 'info.commit.subject',
	},
};

export const _default = () => <CommitSection info={info} />;
