import { Messages, Rooms, Users } from '@rocket.chat/models'; // Importing models to work with messages, rooms, and users
import { canAccessRoomAsync } from '../../../authorization/server/functions/canAccessRoom'; // Importing room access function
import type { IMessage, IUser } from '@rocket.chat/core-typings'; // Importing types for messages and users
import { FindOptions } from 'mongodb'; // Importing FindOptions type from MongoDB for pagination and sorting

/**
 * Function to find messages by custom field in a specific room.
 * 
 * @param {Object} params - Parameters for the search function
 * @param {string} params.uid - The user ID making the request
 * @param {string} params.roomId - The room ID where the messages are stored
 * @param {string} params.customField - The custom field name to search by (e.g., 'AlertID')
 * @param {string} params.value - The value of the custom field to search for (e.g., '1234')
 * @param {Object} params.pagination - Pagination options for the query (offset, count, sort)
 * @returns {Promise<Object>} - A promise that resolves to the paginated messages
 */
export async function findMessagesByCustomField({
  uid,
  roomId,
  customField,
  value,
  pagination: { offset, count, sort },
}: {
  uid: string; // User ID
  roomId: string; // Room ID
  customField: string; // Custom field name (e.g., 'AlertID')
  value: string; // Value to search for in the custom field
  pagination: { offset: number; count: number; sort: FindOptions<IMessage>['sort'] }; // Pagination settings
}): Promise<{
  messages: IMessage[]; // Array of messages that match the search criteria
  count: number; // Number of messages on the current page
  offset: number; // The offset used for pagination
  total: number; // Total number of matching messages
}> {
  // Step 1: Check if the user has access to the specified room
  const room = await Rooms.findOneById(roomId); // Fetch the room by ID
  if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) { // Check if the room exists and if the user can access it
    throw new Error('error-not-allowed'); // If access is not allowed, throw an error
  }

  // Step 2: Fetch the user to make sure they exist and are valid
  const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
  if (!user) { // If user is not found, throw an error
    throw new Error('invalid-user');
  }

  // Step 3: Find the messages in the specified room that match the custom field and its value
  const query = {
    [`customFields.${customField}`]: value, // Search for messages with the custom field's value
    rid: roomId, // Ensure the message is in the specified room
  };

  // Step 4: Fetch messages using pagination and sorting
  const { cursor, totalCount } = Messages.find(query, {
    sort: sort || { ts: -1 }, // Sorting messages by timestamp (newest first)
    skip: offset, // Pagination offset
    limit: count, // Pagination limit
  });

  // Step 5: Await the results and return the paginated messages
  const [messages, total] = await Promise.all([cursor.toArray(), totalCount]);

  return {
    messages, // Return the messages that match the search criteria
    count: messages.length, // Number of messages in the current page
    offset, // Pagination offset
    total, // Total number of matching messages
  };
}
