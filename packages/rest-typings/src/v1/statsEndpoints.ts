import type { IUser } from '@rocket.chat/core-typings';
import type { TelemetryEvents } from '../../../../apps/meteor/server/sdk/types/ITelemetryEvent';

export type StatsEndpoints = {
   'statistics': {
      'GET': (params: { refresh: boolean }) => {
         userId: IUser['_id'];
         refresh: boolean;
      };
   };

   'statistics.list': {
      'GET': (params: { offset: number; count: number; sort: Record<string, unknown>; fields: Record<string, unknown>; query: Record<string, unknown> }) => {
         userId: IUser['_id'];
         query: {} | undefined;
         pagination: {
            offset: number;
            count: number;
            sort: unknown;
            fields: unknown;
         };
      };
   };

   'statistics.telemetry': {
      'POST': (params: { events: Array<{ rid: string; eventName: TelemetryEvents; } | { command: string; eventName: TelemetryEvents; } | { settingsId: string; eventName: TelemetryEvents; }> }) => void;
   };
};