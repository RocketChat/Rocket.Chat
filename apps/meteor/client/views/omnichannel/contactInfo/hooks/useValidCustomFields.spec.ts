import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useValidCustomFields } from './useValidCustomFields';
import { useCustomFieldsQuery } from '../../hooks/useCustomFieldsQuery';

jest.mock('../../hooks/useCustomFieldsQuery', () => ({
	useCustomFieldsQuery: jest.fn(),
}));

const mockedUseCustomFieldsQuery = jest.mocked(useCustomFieldsQuery);

const makeField = (partial: Pick<ILivechatCustomField, '_id' | 'scope'> & Partial<ILivechatCustomField>): ILivechatCustomField => ({
	_updatedAt: new Date(),
	label: 'Field',
	visibility: 'visible',
	...partial,
});

describe('useValidCustomFields', () => {
	const visitorField = makeField({ _id: 'cf_visitor', scope: 'visitor' });
	const roomField = makeField({ _id: 'cf_room', scope: 'room' });

	const withViewPermission = mockAppRoot().withPermission('view-livechat-room-customfields').build();
	const withoutViewPermission = mockAppRoot().build();

	beforeEach(() => {
		mockedUseCustomFieldsQuery.mockReturnValue({
			data: { customFields: [visitorField, roomField] },
			isError: false,
		} as ReturnType<typeof useCustomFieldsQuery>);
	});

	describe('scope', () => {
		const userCustomFields = {
			cf_visitor: 'visitor value',
			cf_room: 'room value',
		};

		it('keeps only visitor-scoped custom fields when scope is visitor', () => {
			const { result } = renderHook(() => useValidCustomFields(userCustomFields, 'visitor'), {
				wrapper: withViewPermission,
			});

			expect(result.current).toEqual([['cf_visitor', 'visitor value']]);
		});

		it('keeps only room-scoped custom fields when scope is room', () => {
			const { result } = renderHook(() => useValidCustomFields(userCustomFields, 'room'), { wrapper: withViewPermission });

			expect(result.current).toEqual([['cf_room', 'room value']]);
		});

		it('omits a key when the field is defined for the other scope', () => {
			mockedUseCustomFieldsQuery.mockReturnValue({
				data: { customFields: [roomField] },
				isError: false,
			} as ReturnType<typeof useCustomFieldsQuery>);

			const { result } = renderHook(() => useValidCustomFields({ cf_room: 'room only' }, 'visitor'), {
				wrapper: withViewPermission,
			});

			expect(result.current).toEqual([]);
		});
	});

	describe('other filters (baseline)', () => {
		it('returns an empty list without view permission even when scope matches', () => {
			const { result } = renderHook(() => useValidCustomFields({ cf_visitor: 'x' }, 'visitor'), { wrapper: withoutViewPermission });

			expect(result.current).toEqual([]);
		});

		it('excludes fields that are not set as visible', () => {
			mockedUseCustomFieldsQuery.mockReturnValue({
				data: {
					customFields: [makeField({ _id: 'cf_hidden', scope: 'visitor', visibility: 'hidden' }), visitorField],
				},
				isError: false,
			} as ReturnType<typeof useCustomFieldsQuery>);

			const { result } = renderHook(() => useValidCustomFields({ cf_hidden: 'secret', cf_visitor: 'ok' }, 'visitor'), {
				wrapper: withViewPermission,
			});

			expect(result.current).toEqual([['cf_visitor', 'ok']]);
		});
	});
});
