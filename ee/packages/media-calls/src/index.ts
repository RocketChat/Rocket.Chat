import type { ISignalGateway } from './global/ISignalGateway';
import { gateway as signalGateway } from './global/SignalGateway';

export { MediaCallDirector } from './global/CallDirector';

export const gateway: ISignalGateway = signalGateway;
