// TODO: check props
export type RoomDropdownItem = {
	id: string;
	label: string;
	checked?: boolean;
};

export type RoomDropDownGroups = {
	label?: string;
	items: RoomDropdownItem[];
}[];

export type RoomTypeDropDownListProps = {
	categories: RoomDropDownGroups;
	width?: number;
	onSelected: RoomTypeOnSelected;
};

export type RoomVisibilityDropDownListProps = {
	categories: RoomDropDownGroups;
	width?: number;
	onSelected: RoomVisibilityOnSelected;
};

export type selectedCategoriesList = (RoomDropdownItem & { checked: true })[];

export type RoomTypeOnSelected = (item: RoomDropdownItem) => void;

export type RoomVisibilityOnSelected = (item: RoomDropdownItem) => void;
