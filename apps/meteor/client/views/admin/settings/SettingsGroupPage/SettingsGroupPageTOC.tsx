import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSettingsSectionId } from '../getSettingsSectionId';

export type SettingsGroupPageTOCProps = {
	groupId: string;
	sections: string[];
};

const getScrollParent = (element: HTMLElement | null): HTMLElement | null => {
	let node = element?.parentElement ?? null;
	while (node) {
		const { overflowY } = getComputedStyle(node);
		if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
			return node;
		}
		node = node.parentElement;
	}
	return null;
};

const SettingsGroupPageTOC = ({ groupId, sections }: SettingsGroupPageTOCProps) => {
	const { t } = useTranslation();
	const navRef = useRef<HTMLElement>(null);

	// Only sections that carry a visible title get an entry in the rail.
	const items = useMemo(
		() => sections.filter(Boolean).map((section) => ({ section, id: getSettingsSectionId(groupId, section) })),
		[sections, groupId],
	);

	const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);

	useEffect(() => {
		setActiveId(items[0]?.id);
	}, [items]);

	// Scroll-spy: highlight the section closest to the top of the scroll area.
	useEffect(() => {
		if (items.length === 0) {
			return undefined;
		}

		const elements = items.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));

		if (elements.length === 0) {
			return undefined;
		}

		const root = getScrollParent(navRef.current) ?? getScrollParent(elements[0]);

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ root, rootMargin: '0px 0px -70% 0px', threshold: 0 },
		);

		elements.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, [items]);

	const handleClick =
		(id: string) =>
		(event: MouseEvent<HTMLElement>): void => {
			event.preventDefault();
			document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			setActiveId(id);
		};

	if (items.length < 2) {
		return null;
	}

	return (
		<Box
			ref={navRef}
			is='nav'
			aria-label={t('Sections')}
			flexShrink={0}
			width='x240'
			pis={32}
			style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}
		>
			<Box mbe={16} fontScale='c1' color='hint'>
				{t('Sections')}
			</Box>
			<Box display='flex' flexDirection='column'>
				{items.map(({ section, id }) => {
					const active = activeId === id;
					return (
						<Box
							key={id}
							is='a'
							href={`#${id}`}
							onClick={handleClick(id)}
							display='flex'
							alignItems='stretch'
							pb={6}
							style={{ gap: '10px', textDecoration: 'none' }}
						>
							<Box
								flexShrink={0}
								width='x3'
								borderRadius='x2'
								style={{ backgroundColor: active ? 'var(--rcx-color-stroke-highlight)' : 'transparent' }}
							/>
							<Box fontScale='p2' color={active ? 'default' : 'secondary-info'} style={{ fontWeight: active ? 600 : 400 }}>
								{t(section as TranslationKey)}
							</Box>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default SettingsGroupPageTOC;
