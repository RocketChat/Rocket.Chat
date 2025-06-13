// https://spec.matrix.org/v1.10/server-server-api/#transactions

interface PDU {
	pdu_type: string;
	content: unknown;
}

interface EDU {
	edu_type: string;
	content: unknown;
}

interface Body {
	edus?: EDU[];
	pdus: PDU[];

	room_id: string;
	origin: string;
	origin_server_ts: number;
}

interface Response {
	pdus: Record<
		`${string}:${string}`,
		{
			error: string;
		}
	>;
}
