import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

export type TableOfContentsEntry = {
	id: string;
	label: string;
};

const useScrollSpy = (ids: string[]): string | undefined => {
	const [activeId, setActiveId] = useState<string | undefined>(ids[0]);

	useEffect(() => {
		setActiveId(ids[0]);

		if (typeof IntersectionObserver === 'undefined') {
			return;
		}

		const visible = new Set<string>();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visible.add(entry.target.id);
					} else {
						visible.delete(entry.target.id);
					}
				}

				const firstVisible = ids.find((id) => visible.has(id));
				if (firstVisible) {
					setActiveId(firstVisible);
				}
			},
			{ rootMargin: '0px 0px -70% 0px', threshold: 0 },
		);

		const elements = ids.map((id) => document.getElementById(id)).filter((element): element is HTMLElement => element !== null);
		elements.forEach((element) => observer.observe(element));

		return () => observer.disconnect();
	}, [ids]);

	return activeId;
};

const itemStyle = css`
	cursor: pointer;
	text-decoration: none;

	&:hover {
		background-color: ${Palette.surface['surface-hover'].toString()};
	}

	&[aria-current='true'] {
		background-color: ${Palette.surface['surface-tint'].toString()};
	}
`;

type SettingsPageTableOfContentsProps = {
	title: string;
	entries: TableOfContentsEntry[];
};

const SettingsPageTableOfContents = ({ title, entries }: SettingsPageTableOfContentsProps) => {
	const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
	const activeId = useScrollSpy(ids);

	const handleSelect = (id: string): void => {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>, id: string): void => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelect(id);
		}
	};

	return (
		<Box is='nav' aria-label={title} width='x260' flexShrink={0} pi={24} pbs={24} display='flex' flexDirection='column'>
			<Box mbe={12} pi={12} fontScale='micro' color='hint' style={{ textTransform: 'uppercase' }}>
				{title}
			</Box>
			{entries.map(({ id, label }) => {
				const isActive = id === activeId;
				return (
					<Box
						key={id}
						is='a'
						role='button'
						tabIndex={0}
						aria-current={isActive ? 'true' : undefined}
						onClick={() => handleSelect(id)}
						onKeyDown={(event: KeyboardEvent<HTMLElement>) => handleKeyDown(event, id)}
						pi={12}
						pb={8}
						mbe={2}
						borderRadius={4}
						fontScale='p2'
						color={isActive ? 'font-info' : 'font-default'}
						className={itemStyle}
					>
						{label}
					</Box>
				);
			})}
		</Box>
	);
};

export default SettingsPageTableOfContents;
