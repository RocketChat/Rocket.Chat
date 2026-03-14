import { SessionsRaw } from './Sessions';

describe('SessionsRaw', () => {
    it('should pass search parameter to $regex unchanged in aggregateSessionsByUserId', async () => {
        const mockCollection = {
            aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
            collectionName: 'sessions',
            createIndexes: jest.fn().mockResolvedValue([]),
        } as any;
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as any;

        const sessionsRaw = new SessionsRaw(mockDb);

        await sessionsRaw.aggregateSessionsByUserId({
            uid: '123',
            search: '.*', // raw regex that should not be escaped
        });

        expect(mockCollection.aggregate).toHaveBeenCalled();
        const pipeline = mockCollection.aggregate.mock.calls[0][0];
        const matchStage = pipeline.find((stage: any) => stage.$match);

        expect(matchStage.$match.$and[0]).toEqual({ searchTerm: { $regex: '.*', $options: 'i' } });
    });

    it('should pass search parameter to $regex unchanged in aggregateSessionsAndPopulate', async () => {
        const mockCollection = {
            aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
            collectionName: 'sessions',
            createIndexes: jest.fn().mockResolvedValue([]),
        } as any;
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as any;

        const sessionsRaw = new SessionsRaw(mockDb);

        await sessionsRaw.aggregateSessionsAndPopulate({
            search: 'a|b', // pipe should not be escaped
        });

        expect(mockCollection.aggregate).toHaveBeenCalled();
        const pipeline = mockCollection.aggregate.mock.calls[0][0];
        const matchStage = pipeline.find((stage: any) => stage.$match);

        expect(matchStage.$match.$and[0]).toEqual({ searchTerm: { $regex: 'a|b', $options: 'i' } });
    });
});
