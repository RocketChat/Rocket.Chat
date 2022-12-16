export interface IOmnichannelTranscriptService {
	getConfig(): unknown;
	requestTranscript(): Promise<void>;
	pdfComplete(data: any): Promise<void>;
}
