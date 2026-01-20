import * as z from 'zod';

export const RoomTypeSchema = z.enum(['c', 'd', 'p', 'l']);

export type RoomType = z.infer<typeof RoomTypeSchema>;
