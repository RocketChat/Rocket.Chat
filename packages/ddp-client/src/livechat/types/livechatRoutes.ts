/* The route below is typed by its migrated implementation
 * (apps/meteor/server/api/v1/omnichannel/room.ts augments `Endpoints` via
 * ExtractRoutesFromAPI), so the standalone `Endpoints` map from
 * @rocket.chat/rest-typings no longer declares it. This SDK compiles without
 * that augmentation and keeps its own minimal contract, mirroring the server
 * response. */

export type LivechatDepartmentTransferResponse = {
	success: boolean;
};
