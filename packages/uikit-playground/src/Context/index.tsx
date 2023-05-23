import createCtx from './createCtx';
import { initialState } from './initialState';
import reducer from './reducer';

const [context, Provider] = createCtx(reducer, initialState);

// eslint-disable-next-line react-refresh/only-export-components
export { context, Provider };
