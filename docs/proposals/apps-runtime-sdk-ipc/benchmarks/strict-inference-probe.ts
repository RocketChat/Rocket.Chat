// Proves that Zod and TypeBox keep a required input field required when the consumer compiles
// with `strict: false`, as the host and base-runtime do. The file compiles only if both do.
import * as z from 'zod';
import { Type, type Static } from '@sinclair/typebox';

const Z = z.strictObject({ messageId: z.string(), note: z.string().optional() });
const T = Type.Object({ messageId: Type.String(), note: Type.Optional(Type.String()) }, { additionalProperties: false });

type ZIn = z.infer<typeof Z>;
type TIn = Static<typeof T>;

// Each line must fail to compile if `messageId` is required.
// @ts-expect-error zod: messageId missing
const z1: ZIn = { note: 'x' };
// @ts-expect-error typebox: messageId missing
const t1: TIn = { note: 'x' };

// Report the key optionality as the compiler sees it.
type RequiredKeys<O> = { [K in keyof O]-?: {} extends Pick<O, K> ? never : K }[keyof O];
const zr: RequiredKeys<ZIn> = 'messageId';
const tr: RequiredKeys<TIn> = 'messageId';
export { z1, t1, zr, tr };
