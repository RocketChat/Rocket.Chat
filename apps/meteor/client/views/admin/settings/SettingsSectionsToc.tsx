import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettingsGroupSections } from '../EditableSettingsContext';

const tocItemStyle = css`
	cursor: pointer;
	border-radius: 4px;

	&:hover {
		background: ${Palette.surface['surface-hover']};
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight']};
		outline-offset: -2px;
	}
`;

type SettingsSectionsTocProps = {
	groupId: string;
	currentTab?: string;
};

function SettingsSectionsToc({ groupId, currentTab }: SettingsSectionsTocProps) {
	const { t, i18n } = useTranslation();
	const sections = useEditableSettingsGroupSections(groupId, currentTab);
	const [activeSection, setActiveSection] = useState<string | undefined>();

	// while a click-initiated smooth scroll is running, the observer is muted so the
	// highlight doesn't jump across the sections passing through the viewport
	const scrollTargetRef = useRef<string | null>(null);
	const scrollTargetTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	const visibleSections = useMemo(() => sections.filter((name) => name), [sections]);

	useEffect(() => {
		if (visibleSections.length < 2) {
			return;
		}

		const elements = visibleSections
			.map((name) => document.querySelector(`[data-qa-section="${CSS.escape(name)}"]`))
			.filter((element): element is Element => element !== null);

		const observer = new IntersectionObserver(
			(entries) => {
				if (scrollTargetRef.current) {
					const targetArrived = entries.some(
						(entry) => entry.isIntersecting && entry.target.getAttribute('data-qa-section') === scrollTargetRef.current,
					);
					if (targetArrived) {
						scrollTargetRef.current = null;
						clearTimeout(scrollTargetTimeoutRef.current);
					}
					return;
				}

				const intersecting = entries.filter((entry) => entry.isIntersecting);
				if (intersecting.length > 0) {
					setActiveSection(intersecting[0].target.getAttribute('data-qa-section') ?? undefined);
				}
			},
			{ rootMargin: '0px 0px -60% 0px' },
		);

		elements.forEach((element) => observer.observe(element));

		return () => {
			observer.disconnect();
			clearTimeout(scrollTargetTimeoutRef.current);
		};
	}, [visibleSections]);

	if (visibleSections.length < 2) {
		return null;
	}

	const handleSectionClick = (name: string) => {
		scrollTargetRef.current = name;
		// safety net: if the user interrupts the smooth scroll the target may never
		// intersect, so the observer is unmuted after a while regardless
		clearTimeout(scrollTargetTimeoutRef.current);
		scrollTargetTimeoutRef.current = setTimeout(() => {
			scrollTargetRef.current = null;
		}, 2000);
		document.querySelector(`[data-qa-section="${CSS.escape(name)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setActiveSection(name);
	};

	const currentSection = activeSection ?? visibleSections[0];

	return (
		<Box
			is='nav'
			aria-label={t('Sections')}
			width='x248'
			height='full'
			flexShrink={0}
			backgroundColor='tint'
			paddingBlockStart={24}
			paddingBlockEnd={36}
			paddingInlineStart={8}
			paddingInlineEnd={16}
			overflowY='auto'
		>
			<Box fontScale='c1' color='hint' paddingInline={10} marginBlockEnd={16}>
				{t('Settings_in_group', { group: i18n.exists(groupId) ? t(groupId as TranslationKey) : groupId })}
			</Box>
			{visibleSections.map((name) => {
				const active = currentSection === name;
				return (
					<Box
						key={name}
						is='button'
						type='button'
						className={tocItemStyle}
						aria-current={active ? 'true' : undefined}
						display='block'
						width='full'
						textAlign='start'
						paddingBlock={6}
						paddingInline={10}
						fontScale={active ? 'p2m' : 'p2'}
						color={active ? 'default' : 'hint'}
						backgroundColor='transparent'
						borderWidth={0}
						onClick={() => handleSectionClick(name)}
					>
						{i18n.exists(name) ? t(name as TranslationKey) : name}
					</Box>
				);
			})}
		</Box>
	);
}

export default SettingsSectionsToc;
