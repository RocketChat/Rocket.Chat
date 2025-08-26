import type { ISignalGateway } from './global/ISignalGateway';
import { gateway as signalGateway } from './global/SignalGateway';
import './agents/casting/CastDirector';

export { MediaCallDirector } from './global/CallDirector';

export const gateway: ISignalGateway = signalGateway;
