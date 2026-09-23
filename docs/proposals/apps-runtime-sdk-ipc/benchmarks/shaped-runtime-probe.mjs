// Proves how the `message.create` input schema behaves at runtime: what it keeps and what it rejects.
import * as z from 'zod';

const Ref = z.looseObject({ id: z.string() });
const MessageInput = z.looseObject({ room: Ref, sender: Ref });
const Input = z.strictObject({ message: MessageInput });

const date = new Date();
const ok = Input.safeParse({ message: { room: { id: 'r', extra: date }, sender: { id: 'u' }, blocks: [1] } });

const checks = {
	'valid input accepted': ok.success,
	'unknown fields kept': ok.success && 'blocks' in ok.data.message,
	'nested Date kept as the same object': ok.success && ok.data.message.room.extra === date,
	'operator object as id rejected': !Input.safeParse({ message: { room: { id: { $ne: null } }, sender: { id: 'u' } } }).success,
	'top-level appId rejected': !Input.safeParse({ message: { room: { id: 'r' }, sender: { id: 'u' } }, appId: 'x' }).success,
};

for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'pass' : 'FAIL'}  ${name}`);
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
