import { CategoryDropdownItem } from './CategoryDropdownDefinitions';

export type TagListProps = {
	selectedCategories: CategoryDropdownItem[];
	onRemoved: CategoryOnRemoved;
};

export type CategoryOnRemoved = (category: CategoryDropdownItem) => void;
