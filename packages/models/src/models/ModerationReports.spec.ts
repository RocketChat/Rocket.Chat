import { ModerationReportsRaw } from './ModerationReports';

describe('ModerationReportsRaw', () => {
    it('should pass selector to $regex unchanged in findReportedMessagesByReportedUserId', async () => {
        const mockCollection = {
            find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]), _bsonType: 'Cursor' }),
            countDocuments: jest.fn().mockResolvedValue(0),
            collectionName: 'moderation_reports',
            createIndexes: jest.fn().mockResolvedValue([]),
        } as any;
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as any;

        const moderationReportsRaw = new ModerationReportsRaw(mockDb);

        await moderationReportsRaw.findReportedMessagesByReportedUserId('123', '.*', { offset: 0, count: 10 });

        expect(mockCollection.find).toHaveBeenCalled();
        const query = mockCollection.find.mock.calls[0][0];

        expect(query['message.msg'].$regex).toBe('.*');
    });

    it('should pass selector to $regex unchanged in countMessageReportsInRange (getSearchQueryForSelector)', () => {
        const mockCollection = {
            countDocuments: jest.fn().mockResolvedValue(0),
            collectionName: 'moderation_reports',
            createIndexes: jest.fn().mockResolvedValue([]),
        } as any;
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as any;

        const moderationReportsRaw = new ModerationReportsRaw(mockDb);

        moderationReportsRaw.countMessageReportsInRange(new Date(), new Date(), '.*');

        expect(mockCollection.countDocuments).toHaveBeenCalled();
        const query = mockCollection.countDocuments.mock.calls[0][0];

        expect(query.$or[0]['message.msg'].$regex).toBe('.*');
        expect(query.$or[1].description.$regex).toBe('.*');
    });

    it('should pass selector to $regex unchanged via getTotalUniqueReportedUsers (getSearchQueryForSelectorUsers)', async () => {
        const mockCollection = {
            aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
            collectionName: 'moderation_reports',
            createIndexes: jest.fn().mockResolvedValue([]),
        } as any;
        const mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as any;

        const moderationReportsRaw = new ModerationReportsRaw(mockDb);

        await moderationReportsRaw.getTotalUniqueReportedUsers(new Date(), new Date(), '.*', false);

        expect(mockCollection.aggregate).toHaveBeenCalled();
        const pipeline = mockCollection.aggregate.mock.calls[0][0];
        const matchStage = pipeline.find((stage: any) => stage.$match);

        expect(matchStage.$match.$or[0]['reportedUser.username'].$regex).toBe('.*');
    });
});
