import type { ReactNode } from 'react';

// Creates the Tamagui config before an exported frame renders, as `withFuselageProvider` does for the other components
import '../tamagui.config';

/**
 * Exports a Tamagui frame as a public component typed with React's DOM attributes. The frame itself is what renders, and
 * what the Tamagui compiler flattens at app use-sites; only its type changes, since React's attribute types (`aria-*` as
 * `Booleanish`) don't match Tamagui's.
 */
export const asPublicFrame = <TProps>(frame: unknown) => frame as ((props: TProps) => ReactNode) & { displayName?: string };
