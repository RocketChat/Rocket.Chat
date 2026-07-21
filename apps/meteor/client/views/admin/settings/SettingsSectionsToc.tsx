import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEditableSettingsGroupSections } from '../EditableSettingsContext';

// the items follow the secondary (ghost) button color lifecycle: transparent
// default → secondary-default on hover → secondary-press while clicking →
// secondary-hover held by the selected/anchored item, plus the keyboard focus
// ring. typography and background live here (not in Box props) so the state
// rules are not overridden by the Box utility classes
const tocItemStyle = css`
	cursor: pointer;
	appearance: none;
	border: none;
	border-radius: 4px;
	background: transparent;
	font-family: inherit;
	font-size: 0.875rem;
	line-height: 1.25rem;
	font-weight: 400;
	color: var(--rcx-color-button-font-on-secondary, #1f2329);

	&:hover {
		background: var(--rcx-color-button-background-secondary-default, #e4e7ea);
	}

	&:active {
		background: var(--rcx-color-button-background-secondary-press, #9ea2a8);
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight']};
		outline-offset: -2px;
	}

	&[aria-current='true'] {
		background: var(--rcx-color-button-background-secondary-hover, #cbced1);
		font-weight: 500;
	}

	& + & {
		margin-block-start: 4px;
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
	const scrollTargetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
		const target = document.querySelector(`[data-qa-section="${CSS.escape(name)}"]`);
		target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		// heavy content (e.g. code editors) resizing mid-animation can cancel the
		// smooth scroll — jump instantly if the section did not arrive
		setTimeout(() => {
			if (target && scrollTargetRef.current === name && Math.abs(target.getBoundingClientRect().top) > 200) {
				target.scrollIntoView({ behavior: 'instant', block: 'start' });
			}
		}, 700);
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
			<Box fontScale='c1' color='hint' paddingInline={12} marginBlockEnd={24}>
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
						paddingBlock={8}
						paddingInline={12}
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
