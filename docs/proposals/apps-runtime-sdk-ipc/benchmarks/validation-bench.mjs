// Measures the per-call cost of validating a bridge-sized input with compiled AJV and with Zod,
// next to the structured clone that every IPC message already pays.
import * as z from 'zod';
import Ajv from 'ajv';
import { Type } from '@sinclair/typebox';

const Z = z.strictObject({ messageId: z.string(), userId: z.string(), reaction: z.string() });
const T = Type.Object({ messageId: Type.String(), userId: Type.String(), reaction: Type.String() }, { additionalProperties: false });
const validate = new Ajv().compile(T);
const input = { messageId: 'abc123', userId: 'u1', reaction: ':smile:' };

function bench(name, fn, n = 2_000_000) {
  for (let i = 0; i < 200_000; i++) fn();
  const t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  const ns = Number(process.hrtime.bigint() - t) / n;
  console.log(`${name.padEnd(22)} ${ns.toFixed(1)} ns/op`);
}
bench('ajv compiled', () => validate(input));
bench('zod safeParse', () => Z.safeParse(input));
// structuredClone approximates the IPC serializer cost per message, for scale
bench('structuredClone (scale)', () => structuredClone({ jsonrpc: '2.0', id: 'x', method: 'message.addReaction', params: input }), 500_000);
