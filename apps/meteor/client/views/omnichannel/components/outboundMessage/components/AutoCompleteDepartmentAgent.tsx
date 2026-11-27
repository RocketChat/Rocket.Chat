import type { ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import { AutoComplete, Option, OptionAvatar, OptionContent } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import type { AllHTMLAttributes } from 'react';
import { useMemo, useState } from 'react';

import UserAvatarChip from '../../../../../components/UserAutoCompleteMultiple/UserAvatarChip';

export type AutoCompleteDepartmentAgentProps = Omit<AllHTMLAttributes<HTMLInputElement>, 'onChange'> & {
	error?: boolean;
	value: string;
	onChange(value: string): void;
	agents?: Serialized<ILivechatDepartmentAgents>[];
};

const AutoCompleteDepartmentAgent = ({ value, onChange, agents, placeholder, ...props }: AutoCompleteDepartmentAgentProps) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const options = useMemo(() => {
		if (!agents) {
			return [];
		}

		return agents
			.filter((agent) => agent.username?.includes(debouncedFilter))
			.sort((a, b) => a.username.localeCompare(b.username))
			.map((agent) => ({
				value: agent.agentId,
				label: agent.username,
			}));
	}, [agents, debouncedFilter]);

	return (
		<AutoComplete
			{...props}
			placeholder={!value ? placeholder : undefined}
			filter={filter}
			setFilter={setFilter}
			value={value}
			onChange={onChange as (value: string | string[]) => void}
			options={options}
			renderSelected={({ selected: { value, label }, ...props }) => {
				return <UserAvatarChip {...props} value={value} username={label} onClick={() => onChange('')} />;
			}}
			renderItem={({ value, label, ...props }) => (
				<Option key={value} {...props}>
					<OptionAvatar>
						<UserAvatar username={label} size={ITEM_MEDIA_SIZE.condensed} />
					</OptionAvatar>
					<OptionContent>{label}</OptionContent>
				</Option>
			)}
		/>
	);
};

export default AutoCompleteDepartmentAgent;
