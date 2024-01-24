/* eslint-disable react-refresh/only-export-components */
import createCtx from './createCtx';
import { initialState } from './initialState';
import reducer from './reducer';
export * from './action';

const initializer = localStorage.getItem('pesrist')
  ? JSON.parse(localStorage.getItem('pesrist') || '')
  : initialState;

const [context, Provider] = createCtx(reducer, initializer);

export { context, Provider };
