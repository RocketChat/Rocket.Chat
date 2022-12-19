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
			// 3. QueueWorker.queueWork() eventually calls PdfWorker.renderToStream()
			// 4. PdfWorker.renderToStream() calls QueueWorker.queueWork() when processing ends and file has been uploaded
			// 5. QueueWorker.queueWork() eventually calls OmnichannelTranscript.pdfComplete() and it notifies the user
			await OmnichannelTranscript.requestTranscript();
		},
	},
);
