import type { ISignalGateway } from './global/ISignalGateway';
import { gateway as signalGateway } from './global/SignalGateway';

export * from './global/CallMonitor';

export const gateway: ISignalGateway = signalGateway;
