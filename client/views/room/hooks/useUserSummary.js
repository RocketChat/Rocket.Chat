import { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Messages,  Subscriptions, Rooms} from '../../../../app/models/client';

//this clearly needs to be optimized 

export const useUserSummary =  (rid, userId) => useReactiveValue(useCallback(() => Messages.find({ $and: [{ rid: rid}, {'u._id': userId}]}).fetch(), [userId]));
export const useUserSummaryAll = (userId) => useReactiveValue(useCallback(() =>  Messages.find({'u._id': userId}).fetch(), [userId]));

export const useUserSubscriptions = (rid, userId) => useReactiveValue(useCallback(() => Subscriptions.find({ $and: [{ rid: rid}, {'u._id': userId}]}).fetch(), [rid, userId]));
export const useUserSubscriptionsAll = (userId) => useReactiveValue(useCallback(() => Subscriptions.find({'u._id': userId}).fetch(), [userId]));

export const useUserRoom = (rid) => useReactiveValue(useCallback((rid) => Rooms.find({ _id: rid }).fetch(), [rid]));