import styled from '@rocket.chat/styled';

import { below } from '../../helpers/tokenBreakpoints';
import { sans } from '../../helpers/tokenFontFamilies';

export const Wrapper = styled('div')`
	width: 100%;
	box-sizing: border-box;
	padding: 28px 16px;
	display: flex;
	flex-flow: column nowrap;
	align-items: center;
	justify-content: center;

	@media (min-width: 1440px) {
		flex-flow: row nowrap;
		align-items: start;
		padding-inline: 0;
		width: 100%;
		max-width: 1152px;
	}
`;

const asideProps = ({ justifyContent: _justifyContent, ...props }: { justifyContent?: string }) => props;

export const Aside = styled('div', asideProps)`
	box-sizing: border-box;
	display: flex;
	flex-flow: column nowrap;
	align-items: center;
	padding-block-end: 16px;
	justify-content: ${(p) => (p.justifyContent ? p.justifyContent : '')};
	max-width: 576px;

	@media (min-width: 1440px) {
		align-items: flex-start;

		flex: 1 0 50%;
		padding-inline: 32px;
	}
`;

export const Content = styled('div')`
	width: 100%;
	display: flex;
	flex-flow: column nowrap;
	align-items: center;

	@media (min-width: 1440px) {
		flex: 1 0 50%;
	}
`;

export const Logo = styled('div')`
	padding-block-end: 28px;

	@media (min-width: 1440px) {
		padding-block-end: 32px;
	}
`;

export const Title = styled('h1')`
	padding-block-end: 32px;
	font-size: ${String(48 / 16)}rem;
	font-family: ${sans};
	font-weight: 800;
	line-height: ${String(64 / 16)}rem;
	text-align: center;

	@media ${below('md')} {
		padding-block-end: 16px;
		font-size: ${String(24 / 16)}rem;
		line-height: ${String(32 / 16)}rem;
	}

	@media (min-width: 1440px) {
		text-align: start;
	}
`;

export const TitleHighlight = styled(
	'span',
	({ fontColor: _fontColor, isDark: _isDark, ...props }: { fontColor?: string; isDark?: boolean }) => props,
)`
	color: ${(p) => (p.isDark ? '#76B7FC' : '#095AD2')};
	display: inline-block;
`;

export const Subtitle = styled(
	'h2',
	({ fontColor: _fontColor, fontWeight: _fontWeight, ...props }: { fontColor?: string; fontWeight?: string }) => props,
)`
	font-size: ${String(16 / 16)}rem;
	line-height: ${String(22 / 16)}rem;
	font-family: ${sans};
	color: ${(p) => (p.fontColor ? p.fontColor : '')};
	font-weight: ${(p) => (p.fontWeight ? p.fontWeight : '500')};
	text-align: center;

	@media (min-width: 1440px) {
		padding-block-end: 20px;
		text-align: start;
	}
`;

export const Description = styled('div')`
	font-family: ${sans};

	// p2
	font-size: ${String(14 / 16)}rem;
	line-height: ${String(20 / 16)}rem;

	@media (min-width: 1440px) {
		display: unset;
	}
`;
