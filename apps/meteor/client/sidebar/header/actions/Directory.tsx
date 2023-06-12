import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useNavigate } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

type DirectoryProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Directory = (props: DirectoryProps) => {
	const navigate = useNavigate();
	const { sidebar } = useLayout();
	const handleDirectory = useMutableCallback(() => {
		sidebar.toggle();
		navigate('/directory');
	});

	return <Sidebar.TopBar.Action {...props} icon='notebook-hashtag' onClick={handleDirectory} />;
};

export default Directory;
