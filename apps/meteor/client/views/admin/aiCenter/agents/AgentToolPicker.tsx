import { Box, CheckBox, Field, FieldLabel, Tag } from '@rocket.chat/fuselage';
import type { AiAgentSummary, AiAgentToolOption, AiEngineSeatCounts } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type AgentToolPickerProps = {
	/** Set on Retry: the options come from this agent's own seat, including any tool the engine has withdrawn. */
	retryTarget: AiAgentSummary | null;
	engine: AiEngineSeatCounts | undefined;
	selected: string[];
	onChange: (selected: string[]) => void;
};

/**
 * Tool checkboxes built from the engine's published tools. Create offers the engine's pool for seats this person can
 * claim; Retry offers the agent's own seat. A withdrawn tool (one the agent has that its seat no longer offers) is shown
 * and marked so it can be removed; once removed it cannot be ticked again.
 */
const AgentToolPicker = ({ retryTarget, engine, selected, onChange }: AgentToolPickerProps): ReactElement => {
	const { t } = useTranslation();
	const options = (retryTarget ? retryTarget.toolOptions : engine?.toolOptions) ?? [];

	const toggle = (tool: AiAgentToolOption) => {
		if (selected.includes(tool.id)) {
			onChange(selected.filter((id) => id !== tool.id));
			return;
		}
		if (!tool.withdrawn) {
			onChange([...selected, tool.id]);
		}
	};

	return (
		<Field>
			<FieldLabel>{t('AI_Agents_tools_label')}</FieldLabel>
			<Box display='flex' flexDirection='column' gap={8}>
				{options.map((tool) => (
					<Box key={tool.id} display='flex' alignItems='center' gap={8}>
						<CheckBox
							aria-label={tool.name}
							checked={selected.includes(tool.id)}
							disabled={tool.withdrawn && !selected.includes(tool.id)}
							onChange={() => toggle(tool)}
						/>
						<span>{tool.name}</span>
						{tool.withdrawn && <Tag variant='warning'>{t('AI_Agents_tool_withdrawn')}</Tag>}
					</Box>
				))}
			</Box>
		</Field>
	);
};

export default AgentToolPicker;
