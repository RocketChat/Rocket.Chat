import {
	callStateToTranslationKey,
	callStateToIcon,
	getFormattedCallDuration,
	getHistoryMessagePayload,
	getHistoryAction,
} from './getHistoryMessagePayload';

const appId = 'media-call-core';
describe('callStateToTranslationKey', () => {
	it('should return correct translation key for "ended" state', () => {
		const result = callStateToTranslationKey('ended');
		expect(result).toEqual({ type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: 'Call ended' });
	});

	it('should return correct translation key for "not-answered" state', () => {
		const result = callStateToTranslationKey('not-answered');
		expect(result).toEqual({ type: 'mrkdwn', i18n: { key: 'Call_not_answered_bold' }, text: 'Call not answered' });
	});

	it('should return correct translation key for "failed" state', () => {
		const result = callStateToTranslationKey('failed');
		expect(result).toEqual({ type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' });
	});

	it('should return correct translation key for "error" state', () => {
		const result = callStateToTranslationKey('error');
		expect(result).toEqual({ type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' });
	});

	it('should return correct translation key for "transferred" state', () => {
		const result = callStateToTranslationKey('transferred');
		expect(result).toEqual({ type: 'mrkdwn', i18n: { key: 'Call_transferred_bold' }, text: 'Call transferred' });
	});
});

describe('callStateToIcon', () => {
	it('should return correct icon for "ended" state', () => {
		const result = callStateToIcon('ended');
		expect(result).toEqual({ type: 'icon', icon: 'phone-off', variant: 'secondary', framed: true });
	});

	it('should return correct icon for "not-answered" state', () => {
		const result = callStateToIcon('not-answered');
		expect(result).toEqual({ type: 'icon', icon: 'phone-question-mark', variant: 'warning', framed: true });
	});

	it('should return correct icon for "failed" state', () => {
		const result = callStateToIcon('failed');
		expect(result).toEqual({ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true });
	});

	it('should return correct icon for "error" state', () => {
		const result = callStateToIcon('error');
		expect(result).toEqual({ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true });
	});

	it('should return correct icon for "transferred" state', () => {
		const result = callStateToIcon('transferred');
		expect(result).toEqual({ type: 'icon', icon: 'arrow-forward', variant: 'secondary', framed: true });
	});
});

describe('getFormattedCallDuration', () => {
	it('should return undefined when callDuration is undefined', () => {
		const result = getFormattedCallDuration(undefined);
		expect(result).toBeUndefined();
	});

	it('should return undefined when callDuration is 0', () => {
		const result = getFormattedCallDuration(0);
		expect(result).toBeUndefined();
	});

	it('should format duration correctly for seconds only (less than 60 seconds)', () => {
		const result = getFormattedCallDuration(30);
		expect(result).toEqual({ type: 'mrkdwn', text: '*00:30*' });
	});

	it('should format duration correctly for minutes and seconds (less than 1 hour)', () => {
		const result = getFormattedCallDuration(125); // 2 minutes 5 seconds
		expect(result).toEqual({ type: 'mrkdwn', text: '*02:05*' });
	});

	it('should format duration correctly for exactly 1 minute', () => {
		const result = getFormattedCallDuration(60);
		expect(result).toEqual({ type: 'mrkdwn', text: '*01:00*' });
	});

	it('should format duration correctly for hours, minutes, and seconds', () => {
		const result = getFormattedCallDuration(3665); // 1 hour 1 minute 5 seconds
		expect(result).toEqual({ type: 'mrkdwn', text: '*01:01:05*' });
	});

	it('should format duration correctly for multiple hours', () => {
		const result = getFormattedCallDuration(7325); // 2 hours 2 minutes 5 seconds
		expect(result).toEqual({ type: 'mrkdwn', text: '*02:02:05*' });
	});

	it('should pad single digit values with zeros', () => {
		const result = getFormattedCallDuration(61); // 1 minute 1 second
		expect(result).toEqual({ type: 'mrkdwn', text: '*01:01*' });
	});

	it('should handle large durations correctly', () => {
		const result = getFormattedCallDuration(36661); // 10 hours 11 minutes 1 second
		expect(result).toEqual({ type: 'mrkdwn', text: '*10:11:01*' });
	});
});

const actionObj = {
	type: 'icon_button',
	icon: { type: 'icon', icon: 'info', variant: 'default' },
	actionId: 'open-history',
	appId,
	blockId: 'callid',
};

describe('getHistoryAction', () => {
	it('should return correct action for "ended" state', () => {
		const result = getHistoryAction('callid');
		expect(result).toEqual(actionObj);
	});
});

describe('getHistoryMessagePayload', () => {
	it('should return correct payload for "ended" state without duration', () => {
		const result = getHistoryMessagePayload('ended', undefined, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'phone-off', variant: 'secondary', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: 'Call ended' },
							],
							action: actionObj,
						},
					],
				},
			],
		});
	});

	it('should return correct payload for "ended" state with duration', () => {
		const result = getHistoryMessagePayload('ended', 125, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'phone-off', variant: 'secondary', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: 'Call ended' },
							],
							action: actionObj,
						},
						{
							background: 'secondary',
							elements: [{ type: 'mrkdwn', text: '*02:05*' }],
						},
					],
				},
			],
		});
	});

	it('should return correct payload for "not-answered" state', () => {
		const result = getHistoryMessagePayload('not-answered', undefined, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'phone-question-mark', variant: 'warning', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_not_answered_bold' }, text: 'Call not answered' },
							],
							action: actionObj,
						},
					],
				},
			],
		});
	});

	it('should return correct payload for "failed" state', () => {
		const result = getHistoryMessagePayload('failed', undefined, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' },
							],
							action: actionObj,
						},
					],
				},
			],
		});
	});

	it('should return correct payload for "error" state', () => {
		const result = getHistoryMessagePayload('error', undefined, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' },
							],
							action: actionObj,
						},
					],
				},
			],
		});
	});

	it('should return correct payload for "transferred" state', () => {
		const result = getHistoryMessagePayload('transferred', undefined, 'callid');
		expect(result).toEqual({
			msg: '',
			groupable: false,
			blocks: [
				{
					appId,
					type: 'info_card',
					rows: [
						{
							background: 'default',
							elements: [
								{ type: 'icon', icon: 'arrow-forward', variant: 'secondary', framed: true },
								{ type: 'mrkdwn', i18n: { key: 'Call_transferred_bold' }, text: 'Call transferred' },
							],
							action: actionObj,
						},
					],
				},
			],
		});
	});

	it('should include duration row when duration is provided', () => {
		const result = getHistoryMessagePayload('ended', 3665, 'callid');

		expect(result.blocks[0].rows).toHaveLength(2);
		expect(result.blocks[0].rows[1]).toEqual({
			background: 'secondary',
			elements: [{ type: 'mrkdwn', text: '*01:01:05*' }],
		});
	});

	it('should not include duration row when duration is undefined', () => {
		const result = getHistoryMessagePayload('ended', undefined, 'callid');
		expect(result.blocks[0].rows).toHaveLength(1);
	});

	it('should handle all call states with duration correctly', () => {
		const states = ['ended', 'transferred', 'not-answered', 'failed', 'error'] as const;
		const duration = 125;

		states.forEach((state) => {
			const result = getHistoryMessagePayload(state, duration, 'callid');
			expect(result.msg).toBe('');
			expect(result.groupable).toBe(false);
			expect(result.blocks).toHaveLength(1);
			expect(result.blocks[0].type).toBe('info_card');
			expect(result.blocks[0].rows).toHaveLength(2);
			expect(result.blocks[0].rows[1].background).toBe('secondary');
			expect(result.blocks[0].rows[1].elements[0].type).toBe('mrkdwn');
			expect(result.blocks[0].rows[0].action).toEqual(actionObj);
			expect(result.blocks[0].rows[1].action).toBeUndefined();
		});
	});
});
