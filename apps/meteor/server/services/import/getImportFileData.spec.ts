import type { IImport } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb';

const mockImportsFindLastImport = jest.fn();
const mockImportsUpdateOne = jest.fn();
const mockImportersGet = jest.fn();

let ProgressStep: typeof import('../../../app/importer/lib/ImporterProgressStep').ProgressStep;
let executeGetImportFileData: typeof import('../../../app/importer/server/methods/getImportFileData').executeGetImportFileData;

jest.mock(
	'@rocket.chat/models',
	() => ({
		Imports: {
			findLastImport: (...args: unknown[]) => mockImportsFindLastImport(...args),
			updateOne: (...args: unknown[]) => mockImportsUpdateOne(...args),
		},
	}),
	{ virtual: true },
);

jest.mock('../../../app/importer/server', () => ({
	Importers: {
		get: (...args: unknown[]) => mockImportersGet(...args),
	},
}));

jest.mock('../../../app/authorization/server/functions/hasPermission', () => ({
	hasPermissionAsync: jest.fn(),
}));

jest.mock('../../../app/importer/server/startup/store', () => ({
	RocketChatImportFileInstance: {
		absolutePath: '/tmp',
	},
}));

jest.mock(
	'meteor/meteor',
	() => {
		class MockMeteorError extends Error {
			error: string;

			reason?: string;

			details?: string;

			errorType = 'Meteor.Error';

			constructor(error: string, reason?: string, details?: string) {
				super(reason);
				this.error = error;
				this.reason = reason;
				this.details = details;
			}
		}

		return {
			Meteor: {
				Error: MockMeteorError,
				methods: jest.fn(),
				userId: jest.fn(),
			},
		};
	},
	{ virtual: true },
);

const createMockOperation = (overrides?: Partial<IImport>): IImport => ({
	_id: new ObjectId().toHexString(),
	type: 'csv',
	importerKey: 'csv',
	ts: new Date(),
	status: ProgressStep.PREPARING_STARTED,
	valid: true,
	user: 'user123',
	_updatedAt: new Date(),
	...overrides,
});

const createMockImporterClass = (step: IImport['status']) =>
	class MockImporter {
		importRecord: IImport;

		progress: { step: IImport['status'] };

		constructor(_info: unknown, operation: IImport) {
			this.importRecord = operation;
			this.progress = { step };
		}

		buildSelection() {
			return { users: [], channels: [], message_count: 0 };
		}

		prepareUsingLocalFile = jest.fn();
	};

describe('executeGetImportFileData', () => {
	beforeAll(async () => {
		({ ProgressStep } = await import('../../../app/importer/lib/ImporterProgressStep'));
		({ executeGetImportFileData } = await import('../../../app/importer/server/methods/getImportFileData'));
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockImportsUpdateOne.mockResolvedValue({ modifiedCount: 1 });
		mockImportersGet.mockReturnValue({
			name: 'CSV',
			key: 'csv',
			importer: createMockImporterClass(ProgressStep.PREPARING_STARTED),
		});
	});

	it.each(['text/plain', 'application/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'])(
		'accepts valid CSV uploads with alternate MIME type %s',
		async (contentType) => {
			mockImportsFindLastImport.mockResolvedValue(createMockOperation({ contentType }));

			await expect(executeGetImportFileData()).resolves.toEqual({ waiting: true });
			expect(mockImportsUpdateOne).not.toHaveBeenCalled();
		},
	);

	it('marks unsupported CSV MIME types as invalid and updates status to error', async () => {
		const operation = createMockOperation({
			_id: 'operation-id',
			contentType: 'application/json',
		});
		mockImportsFindLastImport.mockResolvedValue(operation);

		await expect(executeGetImportFileData()).rejects.toMatchObject({
			error: 'error-import-operation-invalid',
			reason: 'Invalid Import Operation',
			details: 'getImportFileData',
		});

		expect(mockImportsUpdateOne).toHaveBeenCalledWith({ _id: operation._id }, { $set: { status: ProgressStep.ERROR, valid: false } });
	});
});
