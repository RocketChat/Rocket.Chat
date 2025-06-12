import { type Static, t } from 'elysia';
import { ServerNameDto, TimestampDto } from '../common/validation.dto';

export const ServerKeyResponseDto = t.Object({
	old_verify_keys: t.Record(t.String(), t.Any(), {
		description: 'Old verification keys'
	}),
	server_name: ServerNameDto,
	signatures: t.Record(t.String(), t.Any(), {
		description: 'Server signatures'
	}),
	valid_until_ts: TimestampDto,
	verify_keys: t.Record(
		t.String(),
		t.Object({
			key: t.String({ description: 'Base64-encoded public key' })
		}),
		{
			description: 'Current verification keys'
		}
	),
}); 

export type ServerKeyResponse = Static<typeof ServerKeyResponseDto>;