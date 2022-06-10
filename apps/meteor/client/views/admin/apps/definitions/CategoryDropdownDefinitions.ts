export type CategoryDropdownItem = {
	id: string;
	label: string;
	checked?: boolean;
};

export type CategoryDropDownListProps = {
	groups: {
		label?: string;
		items: CategoryDropdownItem[];
	}[];
	width?: number;
	onSelected: CategoryOnSelected;
};

export type CategoryOnSelected = (item: CategoryDropdownItem) => void;
export type CategoryOnRemoved = (category: CategoryDropdownItem) => void;
