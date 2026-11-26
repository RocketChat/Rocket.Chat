// Control frames travel as bare strings, outside the JSON-RPC envelope.
export const _zPING = '_zPING';
export const _zPONG = '_zPONG';

export type ControlFrame = typeof _zPING | typeof _zPONG;

export const isControlFrame = (message: unknown): message is ControlFrame => message === _zPING || message === _zPONG;
