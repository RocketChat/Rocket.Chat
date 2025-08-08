import { type JSONSchemaType } from 'ajv';
import { type ClientMediaSignalAnswer } from './answer';
import { type ClientMediaSignalError } from './error';
import { type ClientMediaSignalHangup } from './hangup';
import { type ClientMediaSignalLocalSDP } from './local-sdp';
import { type ClientMediaSignalLocalState } from './local-state';
import { type ClientMediaSignalRequestCall } from './request-call';
export type ClientMediaSignal = ClientMediaSignalLocalSDP | ClientMediaSignalError | ClientMediaSignalAnswer | ClientMediaSignalHangup | ClientMediaSignalRequestCall | ClientMediaSignalLocalState;
export declare const clientMediaSignalSchema: JSONSchemaType<ClientMediaSignal>;
export declare const isClientMediaSignal: import("ajv").ValidateFunction<ClientMediaSignal>;
export type ClientMediaSignalType = ClientMediaSignal['type'];
type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends {
    type: K;
} ? T : never;
export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;
export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<GenericClientMediaSignal<K>, 'callId' | 'contractId' | 'type'>;
export {};
//# sourceMappingURL=MediaSignal.d.ts.map