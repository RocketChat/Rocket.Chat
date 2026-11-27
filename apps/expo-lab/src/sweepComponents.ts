import * as Fuselage from '@rocket.chat/fuselage';
import type { ComponentType } from 'react';
import { LogBox } from 'react-native';

import { cases } from './sweepCases';

// Errors a boundary caught are still reported to LogBox, whose full-screen overlay would cover the sweep
Object.assign(LogBox, { addException: () => undefined });

const isComponent = (value: unknown): value is ComponentType<Record<string, unknown>> =>
	typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);

export const components = Object.entries(Fuselage)
	.flatMap(([name, value]) => (/^[A-Z]/.test(name) && isComponent(value) ? [{ name, Target: value }] : []))
	.sort((a, b) => a.name.localeCompare(b.name));

export const total = components.length;

export const contextResults = components.flatMap(({ name }) => {
	const context = cases[name]?.context;
	return context ? [{ name, status: 'needs-context' as const, context }] : [];
});
