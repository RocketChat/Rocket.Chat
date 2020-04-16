import { Migrations } from '../../../app/migrations/server';
import { LivechatInquiry } from '../../../app/models/server';

Migrations.add({
	version: 185,
	up() {
		LivechatInquiry.find().forEach((inquiry) => {
            const { _id, ts } = inquiry;

			LivechatInquiry.update({ _id },{
				$set: {
                    queueOrder: 1,
                    estimatedWaitingTimeQueue: 0,
                    estimatedServiceTimeAt: ts,
				},
            });
		});
	},
});
