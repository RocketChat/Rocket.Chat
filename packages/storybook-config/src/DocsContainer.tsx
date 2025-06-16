import { DocsContainer as BaseContainer } from '@storybook/blocks';
import { addons } from '@storybook/preview-api';
import { themes } from '@storybook/theming';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';

const channel = addons.getChannel();

const DocsContainer = (props: ComponentPropsWithoutRef<typeof BaseContainer>) => {
	const [isDark, setDark] = useState(false);

	useEffect(() => {
		channel.on(DARK_MODE_EVENT_NAME, setDark);
		return () => channel.removeListener(DARK_MODE_EVENT_NAME, setDark);
	}, [setDark]);

	return <BaseContainer {...props} theme={isDark ? themes.dark : themes.light} />;
};

export default DocsContainer;
