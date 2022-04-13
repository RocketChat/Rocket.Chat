import { FieldGroup } from '@rocket.chat/fuselage';
import React, { FC, Dispatch, ComponentProps } from 'react';

import PageToggle from './PageToggle';

type OnToggleProps = {
	onToggle: (id: string, isSubscribed: boolean, setSubscribed: Dispatch<boolean>) => void;
};

type PageItem = {
	name: string;
	subscribed: boolean;
	id: string;
};

type PageToggleAssemblerProps = OnToggleProps & {
	pages: PageItem[];
	className?: ComponentProps<typeof PageToggle>['className'];
};

const PageToggleAssembler: FC<PageToggleAssemblerProps> = ({ pages, onToggle, className }) => (
	<FieldGroup>
		{pages.map((page) => (
			<PageToggle key={page.id} {...page} onToggle={onToggle} className={className} />
		))}
	</FieldGroup>
);

export default PageToggleAssembler;
