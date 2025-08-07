import { clientMediaSignalAnswerSchema } from './answer';
import { clientMediaSignalErrorSchema } from './error';
import { clientMediaSignalHangupSchema } from './hangup';
import { clientMediaSignalLocalSDPSchema } from './local-sdp';
import { clientMediaSignalLocalStateSchema } from './local-state';
import { clientMediaSignalRequestCallSchema } from './request-call';
export const clientMediaSignalSchema = {
    type: 'object',
    additionalProperties: true,
    discriminator: { propertyName: 'type' },
    required: ['type'],
    oneOf: [
        clientMediaSignalLocalSDPSchema,
        clientMediaSignalErrorSchema,
        clientMediaSignalAnswerSchema,
        clientMediaSignalHangupSchema,
        clientMediaSignalRequestCallSchema,
        clientMediaSignalLocalStateSchema,
    ],
};
//# sourceMappingURL=MediaSignal.js.map