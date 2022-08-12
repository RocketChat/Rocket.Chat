export type RadioDropDownProps = {
	group: RadioDropDownGroup;
	onSelected: RadioDropDownOnSelected;
};

export type RadioDropDownGroup = {
	label: string;
	items: RadioDropDownItem[];
};

export type RadioDropDownItem = {
	id: string;
	label: string;
	checked: boolean;
};

export type RadioDropDownOnSelected = (item: RadioDropDownItem) => void;

export type RadioDropDownSetData = React.Dispatch<
	React.SetStateAction<{
		label: string;
		items: RadioDropDownItem[];
	}>
>;
