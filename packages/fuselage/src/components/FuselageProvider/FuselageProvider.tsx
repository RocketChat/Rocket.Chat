import { ThemeProvider } from '@tamagui/web';
import type { ReactNode } from 'react';

// Creates the Tamagui config before any frame renders
import '../../tamagui.config';

export { withFuselageProvider, isTamaguiComponent, type WithFuselageProviderOptions } from './withFuselageProvider';

export type FuselageProviderProps = {
	children?: ReactNode;
};

/**
 * Lets the Fuselage components under it share one Tamagui root instead of each acting as its own; it adds no elements
 * around them. Optional: Tamagui's base stylesheet ships in `fuselage.css`.
 */
const FuselageProvider = ({ children }: FuselageProviderProps) => <ThemeProvider defaultTheme='light'>{children}</ThemeProvider>;

export default FuselageProvider;
