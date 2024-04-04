import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatRooms } from '@rocket.chat/models';
import type { UpdateResult } from 'mongodb';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	name: 'Remove Omnichannel stuck rooms caused by improper room closing or queue processing',
	async up() {
		// This migration aims to remove all the rooms that were left in an imporper state due to the closing process
		// not being completed or the queue not updating them properly.
		// Process is as follows:
		// 1. Find all the closed rooms that still have an open inquiry
		// 2. Remove the inquiry
		// 1. Find all the inquiries that point to an invalid rooms
		// 2. Remove the inquiry
		// 1. Find all the inquiries that are queued but have any "takenAt" date
		// 2. Remove the inquiry

		// Closed rooms with open inquiries
		const closedRooms = await LivechatRooms.find({ closedAt: { $exists: true } }, { projection: { _id: 1 } }).toArray();
		const { deletedCount } = await LivechatInquiry.deleteMany({ rid: { $in: closedRooms.map((room) => room._id) } });

		console.log(`[Migration] Removed ${deletedCount} inquiries from closed rooms`);

		// Queued inquiries pointing to a room thats served
		const openAndServedRooms = await LivechatRooms.find({ servedBy: { $exists: true } }, { projection: { _id: 1 } }).toArray();
		const { modifiedCount } = (await LivechatInquiry.updateMany(
			{ rid: { $in: openAndServedRooms.map((room) => room._id) }, status: LivechatInquiryStatus.QUEUED },
			{ $set: { status: LivechatInquiryStatus.TAKEN } },
		)) as UpdateResult;

		console.log(`[Migration] Updated ${modifiedCount} queued inquiries from served rooms`);

		// Queued inquiries with invalid rooms
		const queueInquiries = await LivechatInquiry.find({ status: LivechatInquiryStatus.QUEUED }, { projection: { rid: 1 } }).toArray();

		const validRooms = await LivechatRooms.find(
			{ _id: { $in: queueInquiries.map((inquiry) => inquiry.rid) } },
			{ projection: { _id: 1 } },
		).toArray();

		const { deletedCount: invalidDeletedCount } = await LivechatInquiry.deleteMany({
			status: LivechatInquiryStatus.QUEUED,
			rid: { $nin: validRooms.map((room) => room._id) },
		});

		console.log(`[Migration] Removed ${invalidDeletedCount} inquiries from invalid rooms`);
	},
});
