export type RoomToolboxLayoutItem = {
	id: string;
	featured: boolean;
	order: number;
};

export type RoomToolboxLayoutConfig = {
	maxVisibleNormal: number;
	items: RoomToolboxLayoutItem[];
};

export type RoomToolboxBaseAction = {
	id: string;
	type?: string;
	[key: string]: any;
};
