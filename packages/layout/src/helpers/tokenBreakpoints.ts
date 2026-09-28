import breakpoints from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';

type BreakpointName = keyof typeof breakpoints;

const getMinViewportWidth = (name: BreakpointName): number => breakpoints[name].minViewportWidth ?? 0;

export const from = (name: BreakpointName): string => `(min-width: ${getMinViewportWidth(name)}px)`;

export const below = (name: BreakpointName): string => `(max-width: ${getMinViewportWidth(name) - 0.02}px)`;
