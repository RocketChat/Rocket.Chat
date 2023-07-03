export type CategoryDropdownItem = {
	id: string;
	label: string;
	checked?: boolean;
};

export type CategoryDropDownGroups = {
	label?: string;
	items: CategoryDropdownItem[];
}[];

export type CategoryDropDownListProps = {
	categories: CategoryDropDownGroups;
	width?: number;
	onSelected: CategoryOnSelected;
};

export type selectedCategoriesList = (CategoryDropdownItem & { checked: true })[];

export type CategoryOnSelected = (item: CategoryDropdownItem) => void;
