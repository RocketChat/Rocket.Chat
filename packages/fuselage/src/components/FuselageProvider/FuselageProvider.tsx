import { ThemeProvider } from '@tamagui/web';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

import { tamaguiConfig } from '../../tamagui.config';

// Read before anything renders, so it holds only the base rules and none of the atomic ones; the layer order
// repeats `index.scss` for pages that load `fuselage.css` after this
const baseCSS = `@layer reset, fuselage;\n${tamaguiConfig.getCSS()}`;

const FuselageProviderContext = createContext(false);

export type FuselageProviderProps = {
	children?: ReactNode;
};

/** Lets the Fuselage components under it share one Tamagui root instead of each mounting its own; it adds no elements around them. */
const FuselageProvider = ({ children }: FuselageProviderProps) => (
	<FuselageProviderContext.Provider value>
		{/* jsdom cannot parse the base stylesheet, and tests don't need it */}
		{process.env.NODE_ENV !== 'test' && (
			<style href='fuselage-tamagui' precedence='default'>
				{baseCSS}
			</style>
		)}
		<ThemeProvider defaultTheme='light'>{children}</ThemeProvider>
	</FuselageProviderContext.Provider>
);

/** Keeps a Tamagui-based component renderable in trees that never mounted a `FuselageProvider`. */
export const withFuselageProvider = <TProps extends object>(Component: ComponentType<TProps>) => {
	const WithFuselageProvider = (props: TProps) => {
		if (useContext(FuselageProviderContext)) {
			return <Component {...props} />;
		}

		return (
			<FuselageProvider>
				<Component {...props} />
			</FuselageProvider>
		);
	};

	WithFuselageProvider.displayName = `WithFuselageProvider(${Component.displayName || Component.name || 'Component'})`;

	return WithFuselageProvider;
};

export default FuselageProvider;
