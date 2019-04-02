import { Messages, Subscriptions } from '../../models/server';

export const reply = ({ tmid }, { rid, ts, u }, parentMessage) => {

	if (!tmid) {
		return false;
	}

	const update = {
		$addToSet: {
			replies: {
				$each: [parentMessage.u._id, u._id],
			},
		},
		$set: {
			tlm: ts,
		},
		$inc: {
			tcount: 1,
		},
	};

	Messages.update({
		_id: tmid,
	}, update);

	const msg = Messages.findOne({ _id: tmid }, { fields: { replies: 1 } });

	Subscriptions.update({
		'u._id': { $in: msg.replies },
		rid,
	}, {
		$addToSet: {
			tunread: tmid,
		},
	});
};

export const undoReply = ({ tmid }) => {
	if (!tmid) {
		return false;
	}
	const { ts } = Messages.findOne({ tmid }, { fields: { ts: 1 }, sort: { ts: 1 } }) || {};

	const update = ts ? {
		$set: {
			tlm: ts,
		},
		$inc: {
			tcount: -1,
		},
	} : {
		$unset: {
			tcount: 1,
			tlm: 1,
			replies: 1,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};

export const follow = ({ tmid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	const update = {
		$addToSet: {
			replies: uid,
		},
	};

	return Messages.update({
		_id: tmid,
	}, update);
};

export const unfollow = ({ tmid, rid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	const update = {
		$pull: {
			replies: uid,
		},
	};

	Subscriptions.update({
		'u._id': uid,
		rid,
	}, {
		$pull: {
			tunread: tmid,
		},
	});

	return Messages.update({
		_id: tmid,
	}, update);
};

export const readThread = ({ userId, rid, tmid }) => Subscriptions.update({
	'u._id': userId,
	rid,
}, {
	$pull: {
		tunread: tmid,
	},
});

export const readAllThreads = (rid, uid) => Subscriptions.update({
	rid,
	'u._id': uid,
}, {
	$unset: {
		tunread: 1,
	},
});
