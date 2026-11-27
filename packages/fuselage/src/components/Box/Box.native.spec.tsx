import { render } from '@testing-library/react';

import Box from './Box';
import { extractNativeStyle } from './nativeStyle';

const mockHosts: { host: string; props: Record<string, unknown> }[] = [];

jest.mock(
	'react-native',
	() => {
		const host = (name: string) => (props: Record<string, unknown>) => {
			mockHosts.push({ host: name, props });
			return null;
		};
		return { Image: host('Image'), Text: host('Text'), TextInput: host('TextInput'), View: host('View') };
	},
	{ virtual: true },
);
jest.mock('../../helpers/resolveHost', () => jest.requireActual('../../helpers/resolveHost.native'));
jest.mock('./useStylingProps', () => jest.requireActual('./useStylingProps.native'));

const styleOf = (props: Record<string, unknown>) => extractNativeStyle(props)[1];

describe('Box styling props on native', () => {
	beforeEach(() => {
		mockHosts.length = 0;
	});

	it('hands the host a style instead of a class', () => {
		render(<Box padding={16} backgroundColor='surface-tint' borderRadius='medium' />);

		const [{ host, props }] = mockHosts;
		expect(host).toBe('View');
		expect(props.style).toEqual({ padding: 16, backgroundColor: '#f7f8fa', borderRadius: 4 });
		expect(props).not.toHaveProperty('padding');
		expect(props).not.toHaveProperty('backgroundColor');
	});

	it('keeps the caller style under the styling props', () => {
		render(<Box padding={8} style={{ margin: 1 }} />);

		expect(mockHosts[0].props.style).toEqual([{ margin: 1 }, { padding: 8 }]);
	});

	it('leaves the props that are not styling props alone', () => {
		render(<Box role='group' padding={0} />);

		expect(mockHosts[0].props.role).toBe('group');
	});

	it('truncates text through the host props', () => {
		render(<Box is='span' withTruncatedText />);

		expect(mockHosts[0].props).toMatchObject({ numberOfLines: 1, ellipsizeMode: 'tail' });
	});
});

describe('extractNativeStyle', () => {
	it('reads spacing tokens and numbers as px', () => {
		expect(styleOf({ padding: 12, marginBlockStart: 'x8', gap: 'x4', paddingInline: 'none' })).toEqual({
			padding: 12,
			marginTop: 8,
			gap: 4,
			paddingHorizontal: 0,
		});
	});

	it('maps logical edges to the native ones', () => {
		expect(
			styleOf({
				paddingBlock: 1,
				paddingBlockStart: 2,
				paddingBlockEnd: 3,
				paddingInline: 4,
				paddingInlineStart: 5,
				paddingInlineEnd: 6,
				marginInlineEnd: 7,
				insetBlockStart: 8,
				insetInlineEnd: 9,
			}),
		).toEqual({
			paddingVertical: 1,
			paddingTop: 2,
			paddingBottom: 3,
			paddingHorizontal: 4,
			paddingStart: 5,
			paddingEnd: 6,
			marginEnd: 7,
			top: 8,
			end: 9,
		});
	});

	it('resolves size tokens in rem to numbers at the 16px root', () => {
		expect(styleOf({ width: 'x20', height: 52, minHeight: 20, maxHeight: 155, maxWidth: 'full' })).toEqual({
			width: 20,
			height: 52,
			minHeight: 20,
			maxHeight: 155,
			maxWidth: '100%',
		});
	});

	it('expands size, minSize and maxSize to both axes', () => {
		expect(styleOf({ size: 'x24' })).toEqual({ width: 24, height: 24 });
		expect(styleOf({ minSize: 'x16' })).toEqual({ minWidth: 16, minHeight: 16 });
		expect(styleOf({ maxSize: 'x40' })).toEqual({ maxWidth: 40, maxHeight: 40 });
	});

	it('resolves color tokens to their light value, with no custom property left', () => {
		const style = styleOf({ color: 'default', backgroundColor: 'surface-neutral', borderColor: 'extra-light' });

		for (const value of Object.values(style)) {
			expect(value).toMatch(/^(#|rgb)/);
		}
		expect(Object.keys(style)).toEqual(['color', 'backgroundColor', 'borderColor']);
	});

	it('resolves border width and radius tokens', () => {
		expect(styleOf({ borderWidth: 'default', borderBlockEndWidth: 'none', borderRadius: 'large', borderEndEndRadius: 'small' })).toEqual({
			borderWidth: 1,
			borderBottomWidth: 0,
			borderRadius: 8,
			borderBottomEndRadius: 2,
		});
	});

	it('passes flex values React Native takes and maps start and end', () => {
		expect(
			styleOf({
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'start',
				justifyContent: 'space-between',
				flexGrow: 1,
				flexShrink: '0',
				flexWrap: 'wrap',
				alignSelf: 'center',
			}),
		).toEqual({
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
			flexGrow: 1,
			flexShrink: 0,
			flexWrap: 'wrap',
			alignSelf: 'center',
		});
	});

	it('translates overflow, position, zIndex and opacity', () => {
		expect(styleOf({ overflow: 'hidden', position: 'absolute', zIndex: 2, opacity: 0.5 })).toEqual({
			overflow: 'hidden',
			position: 'absolute',
			zIndex: 2,
			opacity: 0.5,
		});
	});

	it('resolves a font scale to numbers', () => {
		const style = styleOf({ fontScale: 'p2' });

		expect(style).toEqual({
			fontSize: expect.any(Number),
			fontWeight: expect.stringMatching(/^\d+$/),
			letterSpacing: expect.any(Number),
			lineHeight: expect.any(Number),
		});
	});

	it('hides with opacity', () => {
		expect(styleOf({ invisible: true })).toEqual({ opacity: 0 });
	});

	it('drops what React Native has no equivalent for', () => {
		expect(
			styleOf({
				width: 'sw',
				height: 'sh',
				overflowX: 'hidden',
				overflow: 'auto',
				display: 'block',
				order: 1,
				justifySelf: 'center',
				justifyItems: 'center',
				wordBreak: 'break-all',
				verticalAlign: 'middle',
				borderBlockStyle: 'solid',
				border: '1px solid red',
				elevation: '1',
				fontFamily: 'sans',
			}),
		).toEqual({});
	});

	it('skips undefined values and keeps other props', () => {
		const [rest, style] = extractNativeStyle({ padding: undefined, id: 'a' });

		expect(rest).toEqual({ id: 'a' });
		expect(style).toEqual({});
	});
});
