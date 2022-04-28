import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

export type SubscriptionsEndpoints = {
   'subscriptions.get': {
      GET: (params: { updatedSince: Date | unknown }) => {
         result: undefined[];
      };
   };

   'subscriptions.getOne': {
      GET: (params: { roomId: IRoom['_id'] }) => {
         subscription: ISubscription;
      };
   };

   'subscriptions.read': {
      POST: (params: { roomId: IRoom['_id']; messageId: string }) => void;
   };

   'subscriptions.unread': {
      POST: (params: { roomId: IRoom['_id']; firstUnreadMessage: IMessage; messageId: string }) => void;
   };
};
