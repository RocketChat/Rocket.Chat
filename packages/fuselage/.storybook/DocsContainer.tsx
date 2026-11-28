// Keep in step with ../../storybook-config/src/DocsContainer.tsx, which Fuselage can't import: storybook-config depends on Fuselage.
import { DocsContainer as BaseContainer } from '@storybook/addon-docs/blocks';
import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useState } from 'react';

import ComponentStatusNote from './ComponentStatusNote';
import { readThemeGlobalFromUrl, resolveThemeMode, subscribeToThemeMode, themes } from './theme';

const DocsContainer = ({ children, ...props }: ComponentPropsWithoutRef<typeof BaseContainer>) => {
	const [mode, setMode] = useState(() => resolveThemeMode(readThemeGlobalFromUrl()));

	useEffect(() => subscribeToThemeMode(props.context.channel, readThemeGlobalFromUrl(), setMode), [props.context.channel]);

	return (
		<BaseContainer {...props} theme={themes[mode]}>
			<ComponentStatusNote context={props.context} mode={mode} />
			{children}
		</BaseContainer>
	);
};

export default DocsContainer;
