import { lazy } from 'react';

export { default as RoomSkeleton } from './RoomSkeleton';
export const RoomProvider = lazy(() => import('./providers/RoomProvider'));
export const Room = lazy(() => import('./Room'));
export const RoomNotFound = lazy(() => import('./RoomNotFound'));
export const MemberListRouter = lazy(() => import('./MemberListRouter'));
