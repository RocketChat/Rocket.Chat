import type { IUser, IInvite } from '@rocket.chat/core-typings';

export type invitesEndpoints = {
   'listInvites': {
      GET: (params: { userId: IUser['_id'], rid: string }) => {
         invites: IInvite[];
      };
   };

   'findOrCreateInvite': {
      POST: (params: { userId: IUser['_id'], rid: IInvite['rid'], days: IInvite['days'], maxUses: IInvite['maxUses'] }) => {
         invite: IInvite;
      };
   };

   'removeInvite': {
      DELETE: (params: { userId: IUser['_id'], _id: IInvite['_id'] }) => {
         removed: boolean;
      };
   };

   'useInviteToken': {
      POST: (params: { userId: IUser['_id'], token: IInvite['token'] }) => {
         invite: IInvite;
      };
   };

   'validateInviteToken': {
      POST: (params: { userId: IUser['_id'], token: IInvite['token'] }) => {
         invite: IInvite;
      };
   };
};
