import { Accordion } from '@rocket.chat/fuselage';
import React, { ReactNode } from 'react';

type ReleaseItemProps = {
	title: ReactNode;
};

const ReleaseItem = ({ title, ...props }: ReleaseItemProps): JSX.Element => (
	<Accordion.Item title={title} {...props}>
		<p>Introduce redirect URL buttons to conversation flows.</p>
	</Accordion.Item>
);

export default ReleaseItem;
