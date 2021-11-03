import { CategoryDropdownItem } from './CategoryDropdownDefinitions';

export type TagListProps = {
	selectedCategories: CategoryDropdownItem[];
	onClick: CategoryOnClick;
};

export type CategoryOnClick = (category: CategoryDropdownItem) => void;
