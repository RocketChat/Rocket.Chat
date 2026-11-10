import type { Value } from './literal.mts';
import { statusColors, textIconColors } from '../../../src/Theme.ts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { fontScale } from '../../../src/styleTokens.ts';

/** A value under the `--rcx-<name>` custom property a theme can override. */
export const themed = (name: string, value: string) => toCSSValue(`--rcx-${name}`, value);

export const textIconColor = (name: keyof typeof textIconColors) => textIconColors[name].toString();

export const statusFont = (name: string) => statusColors[`status-font-on-${name}` as keyof typeof statusColors].toString();

/** The four declarations of a font scale step. */
export const font = (name: Parameters<typeof fontScale>[0]) => fontScale(name) as unknown as Record<string, Value>;
