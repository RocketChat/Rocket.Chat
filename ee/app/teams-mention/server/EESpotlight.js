import { Team } from '../../../../server/sdk';
import { settings } from '../../../../app/settings/server';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { Users } from '../../../../app/models/server/raw';
import { Subscriptions, Rooms } from '../../../../app/models/server';
import { hasAllPermission, canAccessRoom } from '../../../../app/authorization/server';

export const SpotlightEnterprise = {
    mapOutsiders(_, u) {
        u.outside = true;
        return u;
    },
    mapTeams(_, teams) {
        return teams.map((t) => {
            t.isTeam = true;
            t.username = t.name;
            t.status = 'online';
            return t;
        });
    },
    processLimitAndUsernames(_, options, usernames, users) {
        // Reduce the results from the limit for the next query
        options.limit -= users.length;
    
        // If the limit was reached, return
        if (options.limit <= 0) {
            return users;
        }
    
        // Prevent the next query to get the same users
        usernames.push(...users.map((u) => u.username).filter((u) => !usernames.includes(u)));
    },
    _searchInsiderUsers(_, { rid, text, usernames, options, users, insiderExtraQuery, match = { startsWith: false, endsWith: false } }) {
        // Get insiders first
        if (rid) {
            const searchFields = settings.get('Accounts_SearchFields').trim().split(',');
            users.push(...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, insiderExtraQuery, match).toArray()));
    
            // If the limit was reached, return
            if (this.processLimitAndUsernames(options, usernames, users)) {
                return users;
            }
        }
    },
    _searchOutsiderUsers(_, { text, usernames, options, users, canListOutsiders, match = { startsWith: false, endsWith: false } }) {
        // Then get the outsiders if allowed
        if (canListOutsiders) {
            const searchFields = settings.get('Accounts_SearchFields').trim().split(',');
            users.push(...Promise.await(Users.findByActiveUsersExcept(text, usernames, options, searchFields, undefined, match).toArray()).map(this.mapOutsiders));
    
            // If the limit was reached, return
            if (this.processLimitAndUsernames(options, usernames, users)) {
                return users;
            }
        }
    },
    _searchTeams(_, userId, { text, options, users}) {
        options.limit -= users.length;
    
        if (options.limit <= 0) {
            return users;
        }

        const teamOptions = { ...options, projection: { name: 1, type: 1 } };
        const teams = Promise.await(Team.search(userId, text, teamOptions));
        users.push(...this.mapTeams(teams));

        return users;
    },
    searchUsers(_, { userId, rid, text, usernames }) {
        const users = [];

        const options = {
            limit: settings.get('Number_of_users_autocomplete_suggestions'),
            projection: {
                username: 1,
                nickname: 1,
                name: 1,
                status: 1,
                statusText: 1,
                avatarETag: 1,
            },
            sort: {
                [settings.get('UI_Use_Real_Name') ? 'name' : 'username']: 1,
            },
            readPreference: readSecondaryPreferred(Users.col.s.db),
        };

        const room = Rooms.findOneById(rid, { fields: { _id: 1, t: 1, uids: 1 } });

        if (rid && !room) {
            return users;
        }
    
        const canListOutsiders = hasAllPermission(userId, ['view-outside-room', 'view-d-room']);
        const canListInsiders = canListOutsiders || (rid && canAccessRoom(room, { _id: userId }));
    
        // If can't list outsiders and, wether, the rid was not passed or the user has no access to the room, return
        if (!canListOutsiders && !canListInsiders) {
            return users;
        }
    
        const insiderExtraQuery = [];
    
        if (rid) {
            switch (room.t) {
                case 'd':
                    insiderExtraQuery.push({
                        _id: { $in: room.uids.filter((id) => id !== userId) },
                    });
                    break;
                case 'l':
                    insiderExtraQuery.push({
                        _id: { $in: Subscriptions.findByRoomId(room._id).fetch().map((s) => s.u?._id).filter((id) => id && id !== userId) },
                    });
                    break;
                default:
                    insiderExtraQuery.push({
                        __rooms: rid,
                    });
                    break;
            }
        }

        const searchParams = { rid, text, usernames, options, users, canListOutsiders, insiderExtraQuery };
    
        // Exact match for username only
        if (rid) {
            const exactMatch = Promise.await(Users.findOneByUsernameAndRoomIgnoringCase(text, rid, { projection: options.projection, readPreference: options.readPreference }));
            if (exactMatch) {
                users.push(exactMatch);
                this.processLimitAndUsernames(options, usernames, users);
            }
        }
    
        if (users.length === 0 && canListOutsiders) {
            const exactMatch = Promise.await(Users.findOneByUsernameIgnoringCase(text, { projection: options.projection, readPreference: options.readPreference }));
            if (exactMatch) {
                users.push(this.mapOutsiders(exactMatch));
                this.processLimitAndUsernames(options, usernames, users);
            }
        }
    
        // Contains for insiders
        if (this._searchInsiderUsers(searchParams)) {
            return users;
        }
    
        // Contains for outsiders
        if (this._searchOutsiderUsers(searchParams)) {
            return users;
        }


        if (this._searchTeams(userId, searchParams)) {
            return users;
        }
    
        return users;
    },
};
