import React from 'react';

import Section from './Section';

export default {
	title: 'admin/settings/Section',
	component: Section,
};

export const _default = () => <Section groupId='General' />;

export const skeleton = () => <Section.Skeleton />;
