// Proves what `shaped<T>()` checks at compile time, and why a plain `z.looseObject` is not enough.
// The file compiles only if every claim below holds.
import * as z from 'zod';

interface IRoom { id: string; slugifiedName: string }
interface IMessage { room: IRoom; sender: { id: string }; text?: string }

export const shaped =
	<T>() =>
	<S extends { [K in keyof T]?: z.ZodType }>(shape: S & { [K in Exclude<keyof S, keyof T>]: never }): z.ZodType<T> =>
		z.looseObject(shape as z.ZodRawShape) as unknown as z.ZodType<T>;

const Ref = z.looseObject({ id: z.string() });
declare const message: IMessage;

// A plain loose object has an index signature, which an interface cannot fill.
const Loose = z.looseObject({ room: Ref, sender: Ref });
// @ts-expect-error TS2322 — IRoom has no index signature
const viaLoose: z.infer<typeof Loose> = message;

// `shaped` types the value as the interface itself.
const Shaped = shaped<IMessage>()({ room: Ref, sender: Ref });
const viaShaped: z.infer<typeof Shaped> = message;

// A key that the interface does not have is a compile error.
// @ts-expect-error `rooom` is not a key of IMessage
const typo = shaped<IMessage>()({ rooom: Ref });

// A field schema that does not match the field type is NOT caught: the cast is unchecked.
const wrongFieldSchema = shaped<IMessage>()({ room: z.number() });

export { viaLoose, viaShaped, typo, wrongFieldSchema };
