import { Subscriptions } from '../../models/server/raw';

export const subscribeRooms = (uid) => Subscriptions.find({ 'u._id': uid }, { projection: { rid: 1 } });
