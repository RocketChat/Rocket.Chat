import { css } from '@rocket.chat/css-in-js';
import { Tabs, TabsItem } from '@rocket.chat/fuselage';

export type ToggleTabsProps = {
	tabsItem: string[];
	onChange: (index: number) => void;
	selectedTab: number;
};

const ToggleTabs = ({ tabsItem, onChange, selectedTab }: ToggleTabsProps) => {
	const disableBorder = css`
		border-left: none !important;
		border-right: none !important;
		border-top: none !important;
		box-shadow: none !important;
		margin-right: 0 !important;
	`;
	return (
		<Tabs>
			{tabsItem.map((item: string, index: number) => (
				<TabsItem key={index} selected={selectedTab === index} onClick={() => onChange(index)} className={disableBorder}>
					{item}
				</TabsItem>
			))}
		</Tabs>
	);
};

export default ToggleTabs;
