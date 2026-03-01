import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

export type GroupsListProps = PaginatedRequest<{ name?: string }>;

const groupsListPropsSchema = {
    type: 'object',
    properties: {
        count: {
            type: 'number',
            nullable: true,
        },
        offset: {
            type: 'number',
            nullable: true,
        },
        sort: {
            type: 'string',
            nullable: true,
        },
        fields: {
            type: 'string',
            nullable: true,
        },
        query: {
            type: 'string',
            nullable: true,
        },
        name: {
            type: 'string',
            nullable: true,
        },
    },
    required: [],
    additionalProperties: false,
};

export const isGroupsListProps = ajv.compile<GroupsListProps>(groupsListPropsSchema);
