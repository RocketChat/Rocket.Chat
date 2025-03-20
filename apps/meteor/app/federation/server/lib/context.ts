export const contextDefinitions = {
	ROOM: {
		type: 'room' as const,
		isRoom(event: { context: { roomId?: string } }): boolean {
			return !!event.context.roomId;
		},
		contextQuery(roomId: string) {
			return { roomId };
		},
	},

	defineType(event: { context: { roomId?: string } }): 'room' | 'undefined' {
		if (this.ROOM.isRoom(event)) {
			return this.ROOM.type;
		}

		return 'undefined';
	},
};
