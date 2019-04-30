import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { Statistics } from '../../../models';
import { API } from '../api';

API.v1.addRoute('statistics', { authRequired: true }, {
	get() {
		let refresh = false;
		if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
			refresh = true;
		}

		let stats;
		Meteor.runAsUser(this.userId, () => {
			stats = Meteor.call('getStatistics', refresh);
		});

		return API.v1.success({
			statistics: stats,
		});
	},
});

API.v1.addRoute('statistics.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-statistics')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const statistics = Statistics.find(query, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			statistics,
			count: statistics.length,
			offset,
			total: Statistics.find(query).count(),
		});
	},
});
