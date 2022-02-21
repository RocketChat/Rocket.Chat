import React from 'react';

export type FreePaidDropDownProps = {
	group: FreePaidDropDownGroup;
	onSelected: FreePaidDropDownOnSelected;
};

export type FreePaidDropDownItem = {
	id: string;
	label: string;
	checked: boolean;
};

export type FreePaidDropDownGroup = {
	label: string;
	items: FreePaidDropDownItem[];
};

export type FreePaidDropDownSetData = React.Dispatch<
	React.SetStateAction<{
		label: string;
		items: FreePaidDropDownItem[];
	}>
>;

export type FreePaidDropDownOnSelected = (item: FreePaidDropDownItem) => void;
