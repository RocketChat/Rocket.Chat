import type { ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import { AutoComplete, Box, Chip, Option, OptionAvatar, OptionContent } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { useMemo, useState } from 'react';

type AutoCompleteDepartmentAgentProps = Omit<AllHTMLAttributes<HTMLInputElement>, 'onChange'> & {
	error?: boolean;
	value: string;
	onChange(value: string): void;
	agents?: Serialized<ILivechatDepartmentAgents>[];
};

const AutoCompleteDepartmentAgent = ({ value, onChange, agents, ...props }: AutoCompleteDepartmentAgentProps) => {
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 1000);

	const options = useMemo(() => {
		if (!agents) {
			return [];
		}

		return agents
			.filter((agent) => agent.username?.includes(debouncedFilter))
			.map((agent) => ({
				value: agent.agentId,
				label: agent.username,
			}));
	}, [agents, debouncedFilter]);

	return (
		<AutoComplete
			{...props}
			filter={filter}
			setFilter={setFilter}
			value={value}
			onChange={onChange as (value: string | string[]) => void}
			options={options}
			renderSelected={({ selected: { value, label }, ...props }): ReactElement => {
				return (
					<Chip {...props} height='x20' value={value} onClick={() => onChange('')} mie={4}>
						<UserAvatar size='x20' username={value} />
						<Box is='span' margin='none' mis={4}>
							{label}
						</Box>
					</Chip>
				);
			}}
			renderItem={({ value, label, ...props }): ReactElement => (
				<Option key={value} {...props}>
					<OptionAvatar>
						<UserAvatar username={value} size='x20' />
					</OptionAvatar>
					<OptionContent>{label}</OptionContent>
				</Option>
			)}
		/>
	);
};

export default AutoCompleteDepartmentAgent;
