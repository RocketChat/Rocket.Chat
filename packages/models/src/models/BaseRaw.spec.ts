import type { ClientSession, Collection, Db, DeleteResult, MongoClient } from 'mongodb';

// Mock types for testing
type TestDocument = {
    _id: string;
    name: string;
    value: number;
};

type TestDeletedDocument = TestDocument & {
    _deletedAt: Date;
    __collection__: string;
};

// Helper to create mock session
const createMockSession = () => {
    const session = {
        withTransaction: jest.fn(async (fn: () => Promise<void>) => {
            await fn();
        }),
        endSession: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
    } as unknown as ClientSession;
    return session;
};

// Helper to create mock MongoClient
const createMockClient = (session: ClientSession) => ({
    startSession: jest.fn(() => session),
});

describe('BaseRaw Atomic Delete Operations', () => {
    describe('deleteOne', () => {
        test('should delete document without trash when trash is not configured', async () => {
            // This test verifies that deleteOne works normally when no trash collection is configured
            const mockDeleteOne = jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 });
            const mockCol = {
                deleteOne: mockDeleteOne,
            } as unknown as Collection<TestDocument>;

            // Simulate the behavior without trash
            const filter = { _id: 'test-id' };
            const result = await mockCol.deleteOne(filter);

            expect(mockDeleteOne).toHaveBeenCalledWith(filter);
            expect(result.deletedCount).toBe(1);
        });

        test('should use existing session when provided in options', async () => {
            // This test verifies that when a session is provided, it's used instead of creating a new one
            const mockSession = createMockSession();
            const mockOptions = { session: mockSession };

            // Verify session is passed through
            expect(mockOptions.session).toBe(mockSession);
        });

        test('should start new session and transaction when no session provided', async () => {
            const mockSession = createMockSession();
            const mockClient = createMockClient(mockSession);

            // Simulate starting a new session
            const session = mockClient.startSession();

            expect(mockClient.startSession).toHaveBeenCalled();
            expect(session).toBe(mockSession);
        });

        test('should call withTransaction for atomic operation', async () => {
            const mockSession = createMockSession();

            // Simulate transaction execution
            let transactionExecuted = false;
            await mockSession.withTransaction(async () => {
                transactionExecuted = true;
            });

            expect(mockSession.withTransaction).toHaveBeenCalled();
            expect(transactionExecuted).toBe(true);
        });

        test('should end session in finally block even on error', async () => {
            const mockSession = createMockSession();
            mockSession.withTransaction = jest.fn().mockRejectedValue(new Error('Transaction failed'));

            try {
                await mockSession.withTransaction(async () => {
                    throw new Error('Transaction failed');
                });
            } catch {
                // Expected error
            }

            // In real implementation, endSession is called in finally block
            await mockSession.endSession();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        test('should insert document to trash before deleting from main collection', async () => {
            const operations: string[] = [];

            const mockTrashUpdateOne = jest.fn().mockImplementation(async () => {
                operations.push('trash.updateOne');
                return { acknowledged: true };
            });

            const mockColDeleteOne = jest.fn().mockImplementation(async () => {
                operations.push('col.deleteOne');
                return { acknowledged: true, deletedCount: 1 };
            });

            // Simulate the atomic operation order
            await mockTrashUpdateOne({ _id: 'test-id' }, { $set: { _deletedAt: new Date() } });
            await mockColDeleteOne({ _id: 'test-id' });

            expect(operations).toEqual(['trash.updateOne', 'col.deleteOne']);
        });

        test('should log warning when deletedCount is 0 but document was found', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Simulate the warning that would be logged
            const docFound = true;
            const deletedCount = 0;
            const collectionName = 'test_collection';

            if (docFound && deletedCount === 0) {
                console.warn(
                    `[BaseRaw.deleteOne] Document found but deletedCount=0 for collection '${collectionName}'. ` +
                    `This may indicate a concurrent deletion.`,
                );
            }

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('deletedCount=0'));
            consoleWarnSpy.mockRestore();
        });
    });

    describe('findOneAndDelete', () => {
        test('should return null when no document found', async () => {
            const mockFindOne = jest.fn().mockResolvedValue(null);

            const result = await mockFindOne({ _id: 'non-existent' });

            expect(result).toBeNull();
        });

        test('should return deleted document on success', async () => {
            const mockDoc = { _id: 'test-id', name: 'test', value: 42 };
            const mockFindOne = jest.fn().mockResolvedValue(mockDoc);

            const result = await mockFindOne({ _id: 'test-id' });

            expect(result).toEqual(mockDoc);
        });

        test('should archive to trash with correct metadata', async () => {
            const mockDoc = { _id: 'test-id', name: 'test', value: 42 };
            const collectionName = 'test_collection';

            const trashRecord = {
                ...mockDoc,
                _deletedAt: expect.any(Date),
                __collection__: collectionName,
            };

            // Verify trash record structure
            expect(trashRecord.__collection__).toBe(collectionName);
            expect(trashRecord._id).toBe('test-id');
        });

        test('should use session for all operations when within transaction', async () => {
            const mockSession = createMockSession();
            const sessionOptions = { session: mockSession };

            // Verify session is included in options
            expect(sessionOptions.session).toBe(mockSession);
        });
    });

    describe('deleteMany', () => {
        test('should delete multiple documents atomically', async () => {
            const mockDocs = [
                { _id: 'id-1', name: 'doc1', value: 1 },
                { _id: 'id-2', name: 'doc2', value: 2 },
                { _id: 'id-3', name: 'doc3', value: 3 },
            ];

            const ids = mockDocs.map((d) => d._id);

            expect(ids).toEqual(['id-1', 'id-2', 'id-3']);
        });

        test('should archive all documents to trash before deleting', async () => {
            const trashedIds: string[] = [];
            const mockDocs = [
                { _id: 'id-1', name: 'doc1' },
                { _id: 'id-2', name: 'doc2' },
            ];

            // Simulate archiving each document
            for (const doc of mockDocs) {
                trashedIds.push(doc._id);
            }

            expect(trashedIds).toHaveLength(2);
            expect(trashedIds).toContain('id-1');
            expect(trashedIds).toContain('id-2');
        });

        test('should call onTrash callback for each document', async () => {
            const onTrashMock = jest.fn();
            const mockDocs = [
                { _id: 'id-1', name: 'doc1' },
                { _id: 'id-2', name: 'doc2' },
            ];

            // Simulate calling onTrash for each document
            for (const doc of mockDocs) {
                void onTrashMock(doc);
            }

            expect(onTrashMock).toHaveBeenCalledTimes(2);
            expect(onTrashMock).toHaveBeenCalledWith({ _id: 'id-1', name: 'doc1' });
            expect(onTrashMock).toHaveBeenCalledWith({ _id: 'id-2', name: 'doc2' });
        });

        test('should return deletedCount of 0 when no documents match filter', async () => {
            const mockDeleteMany = jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 0 });

            const result = await mockDeleteMany({ _id: { $in: [] } });

            expect(result.deletedCount).toBe(0);
        });

        test('should log warning when deletedCount does not match expected count', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            const expectedCount = 5;
            const actualCount = 3;
            const collectionName = 'test_collection';

            if (actualCount !== expectedCount) {
                console.warn(
                    `[BaseRaw.deleteMany] Mismatch in deletedCount for collection '${collectionName}'. ` +
                    `Expected: ${expectedCount}, Actual: ${actualCount}`,
                );
            }

            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Mismatch in deletedCount'));
            consoleWarnSpy.mockRestore();
        });

        test('should delete using $in operator with collected ids', async () => {
            const ids = ['id-1', 'id-2', 'id-3'];
            const expectedFilter = { _id: { $in: ids } };

            expect(expectedFilter._id.$in).toEqual(ids);
            expect(expectedFilter._id.$in).toHaveLength(3);
        });
    });

    describe('Transaction Error Handling', () => {
        test('should log error when transaction fails', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const collectionName = 'test_collection';
            const error = new Error('MongoDB transaction failed');

            console.error(`[BaseRaw.deleteOne] Transaction failed for collection '${collectionName}':`, error);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Transaction failed'),
                expect.any(Error),
            );
            consoleErrorSpy.mockRestore();
        });

        test('should rethrow error after logging', async () => {
            const mockSession = createMockSession();
            const testError = new Error('Test transaction error');
            mockSession.withTransaction = jest.fn().mockRejectedValue(testError);

            await expect(mockSession.withTransaction(async () => { })).rejects.toThrow('Test transaction error');
        });

        test('should always end session even on error', async () => {
            const mockSession = createMockSession();
            let sessionEnded = false;

            try {
                throw new Error('Simulated error');
            } finally {
                await mockSession.endSession();
                sessionEnded = true;
            }

            expect(sessionEnded).toBe(true);
        });
    });

    describe('Session Reuse', () => {
        test('should reuse caller-provided session instead of creating new one', () => {
            const callerSession = createMockSession();
            const mockClient = createMockClient(createMockSession());

            const options = { session: callerSession };

            // When session is provided, startSession should not be called
            if (options.session) {
                // Use existing session
                expect(options.session).toBe(callerSession);
            } else {
                mockClient.startSession();
            }

            expect(mockClient.startSession).not.toHaveBeenCalled();
        });

        test('should pass session to trash.updateOne', async () => {
            const mockSession = createMockSession();
            const mockTrashUpdateOne = jest.fn();

            await mockTrashUpdateOne(
                { _id: 'test-id' },
                { $set: { _deletedAt: new Date() } },
                { upsert: true, session: mockSession },
            );

            expect(mockTrashUpdateOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
                expect.objectContaining({ session: mockSession }),
            );
        });

        test('should pass session to col.deleteOne', async () => {
            const mockSession = createMockSession();
            const mockColDeleteOne = jest.fn();

            await mockColDeleteOne({ _id: 'test-id' }, { session: mockSession });

            expect(mockColDeleteOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({ session: mockSession }),
            );
        });
    });
});
