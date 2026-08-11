import { DocsContainer as BaseContainer } from '@storybook/addon-docs/blocks';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';
import { addons } from 'storybook/preview-api';
import { themes } from 'storybook/theming';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';

const channel = addons.getChannel();

export type DocsContainerProps = ComponentPropsWithoutRef<typeof BaseContainer>;

const DocsContainer = (props: DocsContainerProps) => {
	const [isDark, setDark] = useState(false);

	useEffect(() => {
		channel.on(DARK_MODE_EVENT_NAME, setDark);
		return () => channel.removeListener(DARK_MODE_EVENT_NAME, setDark);
	}, [setDark]);

	return <BaseContainer {...props} theme={isDark ? themes.dark : themes.light} />;
};

export default DocsContainer;
