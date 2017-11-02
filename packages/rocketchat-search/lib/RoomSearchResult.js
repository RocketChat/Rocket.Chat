/**
 * Transport object for a single result when searching for Rooms
 */
export class RoomSearchResult {
	constructor(roomId, title, formattedExcerpt) {
		this.roomId = roomId;
		this.title = title;
		this.formattedExcerpt = formattedExcerpt;
	}
}
