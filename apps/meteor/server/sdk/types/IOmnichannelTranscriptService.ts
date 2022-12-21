export interface IOmnichannelTranscriptService {
	getConfig(): unknown;
	requestTranscript(data: { details: any }): Promise<void>;
	pdfComplete(data: any): Promise<void>;
}
