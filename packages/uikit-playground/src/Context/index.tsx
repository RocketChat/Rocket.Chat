import createCtx from './createCtx';
import { initialState } from './initialState';
import reducer from './reducer';

export * from './action';

const [context, Provider] = createCtx(reducer, initialState);

export { context, Provider };
