import { API } from '../../../../../app/api/server';
import { OmnichannelTranscript } from '../../../../../server/sdk';

// This is a public route for testing purposes, this should be updated before merging into develop
API.v1.addRoute(
	'omnichannel/request-transcript',
	{ authRequired: false },
	{
		async post() {
			// Missing:
			// Authentication
			// Permissions
			// Validation
			// Actual body parsing
			// Room access validation
			// etc.

			// Flow is as follows:
			// 1. Call OmnichannelTranscript.requestTranscript()
			// 2. OmnichannelTranscript.requestTranscript() calls QueueWorker.queueWork()
			// 3. QueueWorker.queueWork() eventually calls OmnichannelTranscript.workOnPdf()
			// 4. OmnichannelTranscript.workOnPdf() calls OmnichannelTranscript.pdfComplete() when processing ends
			// 5. OmnichannelTranscript.pdfComplete() sends the messages to the user, and updates the room with the flags
			await OmnichannelTranscript.requestTranscript({
				details: {
					userId: 'rocketchat.internal.admin.test',
					rid: '5YaYgnEiqEDEYyPXN',
				},
			});
		},
	},
);
