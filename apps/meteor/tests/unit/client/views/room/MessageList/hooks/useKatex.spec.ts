import { renderHook } from '@testing-library/react-hooks';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const COMPONENT_PATH = '../../../../../../../client/views/room/MessageList/hooks/useKatex';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useSetting: () => true,
	},
};

describe('room/MessageList/hooks/useKatex', () => {
	it('should return enabled true dollar syntax true and parenthesis syntax true if all settings is enabled', () => {
		const { useKatex } = proxyquire.load(COMPONENT_PATH, defaultConfig);

		const { result } = renderHook(() => useKatex());

		expect(result.current.katexEnabled).to.be.equal(true);
		expect(result.current.katexDollarSyntaxEnabled).to.be.equal(true);
		expect(result.current.katexParenthesisSyntaxEnabled).to.be.equal(true);
	});

	it('should return enabled false dollar syntax false and parenthesis syntax false if all settings is disabled', () => {
		const { useKatex } = proxyquire.load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useSetting: () => false,
			},
		});

		const { result } = renderHook(() => useKatex());

		expect(result.current.katexEnabled).to.be.equal(false);
		expect(result.current.katexDollarSyntaxEnabled).to.be.equal(false);
		expect(result.current.katexParenthesisSyntaxEnabled).to.be.equal(false);
	});

	it('should return enabled true dollar syntax false and parenthesis syntax false if Katex_Enabled settings is enable', () => {
		const { useKatex } = proxyquire.load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useSetting: (str: string) => str === 'Katex_Enabled',
			},
		});

		const { result } = renderHook(() => useKatex());

		expect(result.current.katexEnabled).to.be.equal(true);
		expect(result.current.katexDollarSyntaxEnabled).to.be.equal(false);
		expect(result.current.katexParenthesisSyntaxEnabled).to.be.equal(false);
	});

	it('should return enabled false dollar syntax false and parenthesis syntax false if DollarSyntaxEnabled and ParenthesisSyntaxEnabled settings is enable', () => {
		const { useKatex } = proxyquire.load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useSetting: (str: string) => str === 'DollarSyntaxEnabled' || str === 'ParenthesisSyntaxEnabled',
			},
		});

		const { result } = renderHook(() => useKatex());

		expect(result.current.katexEnabled).to.be.equal(false);
		expect(result.current.katexDollarSyntaxEnabled).to.be.equal(false);
		expect(result.current.katexParenthesisSyntaxEnabled).to.be.equal(false);
	});
});
