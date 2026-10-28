import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useValidCustomFields } from './useValidCustomFields';

const makeField = (partial: Pick<ILivechatCustomField, '_id' | 'scope'> & Partial<ILivechatCustomField>): ILivechatCustomField => ({
	_updatedAt: new Date(),
	label: 'Field',
	visibility: 'visible',
	...partial,
});

const buildWrapper = ({ withPermission, customFields }: { withPermission: boolean; customFields: ILivechatCustomField[] }) => {
	const builder = mockAppRoot().withEndpoint(
		'GET',
		'/v1/livechat/custom-fields',
		() =>
			({
				customFields,
				total: customFields.length,
				offset: 0,
				count: customFields.length,
			}) as any,
	);

	if (withPermission) {
		builder.withPermission('view-livechat-room-customfields');
	}

	return builder.build();
};

describe('useValidCustomFields', () => {
	const visitorField = makeField({ _id: 'cf_visitor', scope: 'visitor' });
	const roomField = makeField({ _id: 'cf_room', scope: 'room' });

	describe('scope', () => {
		const userCustomFields = {
			cf_visitor: 'visitor value',
			cf_room: 'room value',
		};

		it('keeps only visitor-scoped custom fields when scope is visitor', async () => {
			const { result } = renderHook(() => useValidCustomFields(userCustomFields, 'visitor'), {
				wrapper: buildWrapper({ withPermission: true, customFields: [visitorField, roomField] }),
			});

			await waitFor(() => expect(result.current).toEqual([['cf_visitor', 'visitor value']]));
		});

		it('keeps only room-scoped custom fields when scope is room', async () => {
			const { result } = renderHook(() => useValidCustomFields(userCustomFields, 'room'), {
				wrapper: buildWrapper({ withPermission: true, customFields: [visitorField, roomField] }),
			});

			await waitFor(() => expect(result.current).toEqual([['cf_room', 'room value']]));
		});

		it('omits a key when the field is defined for the other scope', async () => {
			const { result } = renderHook(() => useValidCustomFields({ cf_room: 'room only' }, 'visitor'), {
				wrapper: buildWrapper({ withPermission: true, customFields: [roomField] }),
			});

			await waitFor(() => expect(result.current).toEqual([]));
		});
	});

	describe('other filters (baseline)', () => {
		it('returns an empty list without view permission even when scope matches', async () => {
			const { result } = renderHook(() => useValidCustomFields({ cf_visitor: 'x' }, 'visitor'), {
				wrapper: buildWrapper({ withPermission: false, customFields: [visitorField] }),
			});

			await waitFor(() => expect(result.current).toEqual([]));
		});

		it('excludes fields that are not set as visible', async () => {
			const hiddenField = makeField({ _id: 'cf_hidden', scope: 'visitor', visibility: 'hidden' });
			const { result } = renderHook(() => useValidCustomFields({ cf_hidden: 'secret', cf_visitor: 'ok' }, 'visitor'), {
				wrapper: buildWrapper({ withPermission: true, customFields: [hiddenField, visitorField] }),
			});

			await waitFor(() => expect(result.current).toEqual([['cf_visitor', 'ok']]));
		});
	});
});
