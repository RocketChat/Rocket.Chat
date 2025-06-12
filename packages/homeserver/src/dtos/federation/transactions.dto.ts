import { type Static, t } from 'elysia';
import { EventBaseDto } from '../common/event.dto';

export const SendTransactionParamsDto = t.Object({
	txnId: t.String({ description: 'Transaction ID' }),
});

export const SendTransactionBodyDto = t.Object({
	pdus: t.Array(EventBaseDto, { 
		description: 'Persistent data units (PDUs) to process',
		default: []
	}),
	edus: t.Optional(t.Array(t.Any(), { 
		description: 'Ephemeral data units (EDUs)',
		default: []
	})),
});

export const SendTransactionResponseDto = t.Object({
	pdus: t.Record(t.String(), t.Any(), { 
		description: 'Processing results for each PDU'
	}),
	edus: t.Record(t.String(), t.Any(), { 
		description: 'Processing results for each EDU'
	}),
}); 

export type SendTransactionParams = Static<typeof SendTransactionParamsDto>;
export type SendTransactionBody = Static<typeof SendTransactionBodyDto>;
export type SendTransactionResponse = Static<typeof SendTransactionResponseDto>;