import { Meteor } from 'meteor/meteor';
import { API } from '../../api';

API.v1.addRoute(
    'federation/searchPublicRooms',
    { authRequired: true },
    {
        async get() {
            const { offset, count } = this.getPaginationItems();
            const { sort, fields, query } = this.parseJsonQuery();
            console.log({
                offset,
                count,
                sort,
                fields,
                query,
            })
            return API.v1.success({

            });
        },
    },
);
