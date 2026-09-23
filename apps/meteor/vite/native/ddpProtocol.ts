// Vite-build implementation of client/lib/sdk/ddpProtocol.ts on the npm EJSON package.
import EJSON from 'ejson';

export const parseDDP = (message: string): any => EJSON.parse(message);

export const stringifyDDP = (message: unknown): string => EJSON.stringify(message);

export type DDPMessage = Parameters<typeof stringifyDDP>[0];
