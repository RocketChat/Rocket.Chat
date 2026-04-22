import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import type { IMedsenseDocumentationTemplate, IMedsenseIntervention } from '@rocket.chat/core-typings';
import React from 'react';

const styles = StyleSheet.create({
	page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
	header: { fontSize: 16, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
	meta: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1 solid #ccc', paddingBottom: 10 },
	metaItem: { width: '48%' },
	label: { fontSize: 10, color: '#666', marginBottom: 2 },
	value: { fontSize: 12, marginBottom: 8 },
	section: { marginBottom: 15 },
	sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, backgroundColor: '#f0f0f0', padding: 5 },
	fieldRow: { flexDirection: 'row', marginBottom: 5 },
	fieldLabel: { width: '40%', fontWeight: 'bold' },
	fieldValue: { width: '60%' },
	repeaterBlock: { marginTop: 6, marginBottom: 8 },
	repeaterTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
	repeaterTable: { display: 'flex', flexDirection: 'column', border: '1 solid #d5dbe0', borderRadius: 4, overflow: 'hidden' },
	repeaterHeaderRow: { flexDirection: 'row', backgroundColor: '#edf2f5' },
	repeaterHeaderCell: { flexGrow: 1, flexBasis: 0, padding: 6, fontSize: 9, fontWeight: 'bold', borderRight: '1 solid #d5dbe0' },
	repeaterRow: { flexDirection: 'row', borderTop: '1 solid #e5e9ec' },
	repeaterCell: { flexGrow: 1, flexBasis: 0, padding: 6, fontSize: 9, borderRight: '1 solid #e5e9ec' },
	signatures: { marginTop: 30, borderTop: '1 solid #ccc', paddingTop: 10 },
	signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
	signatureBlock: { width: '45%' },
	signatureImage: { width: 180, height: 60, objectFit: 'contain', marginTop: 6 },
	signatureName: { marginTop: 20, borderTop: '1 solid #000', paddingTop: 5, textAlign: 'center' },
	footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#999', fontSize: 9 },
});

const formatPdfValue = (value: any): string =>
	value === undefined || value === null || value === ''
		? '-'
		: Array.isArray(value)
			? value.map((item) => formatPdfValue(item)).join(', ')
			: typeof value === 'boolean'
				? value
					? 'Yes'
					: 'No'
				: String(value);

const renderRepeaterField = (field: any, rows: any[]) => {
	const childFields = (field.fields || []).filter((child: any) => child.visibleInPdf !== false);
	const populatedRows = rows.filter((row) =>
		Object.values(row || {}).some((value) => value !== undefined && value !== null && value !== ''),
	);
	if (!childFields.length) {
		return (
			<View style={styles.fieldRow}>
				<Text style={styles.fieldLabel}>{field.label}:</Text>
				<Text style={styles.fieldValue}>-</Text>
			</View>
		);
	}

	if (!populatedRows.length) {
		return (
			<View style={styles.fieldRow}>
				<Text style={styles.fieldLabel}>{field.label}:</Text>
				<Text style={styles.fieldValue}>-</Text>
			</View>
		);
	}

	return (
		<View style={styles.repeaterBlock}>
			<Text style={styles.repeaterTitle}>{field.pdfTitle || field.label}</Text>
			<View style={styles.repeaterTable}>
				<View style={styles.repeaterHeaderRow}>
					{childFields.map((child: any, childIndex: number) => (
						<Text
							key={`${field.key}-header-${child.key}`}
							style={[styles.repeaterHeaderCell, childIndex === childFields.length - 1 ? { borderRight: '0' } : null]}
						>
							{child.pdfTitle || child.label}
						</Text>
					))}
				</View>
				{populatedRows.map((row: Record<string, any>, rowIndex: number) => (
					<View key={`${field.key}-row-${rowIndex}`} style={styles.repeaterRow}>
						{childFields.map((child: any, childIndex: number) => (
							<Text
								key={`${field.key}-${rowIndex}-${child.key}`}
								style={[styles.repeaterCell, childIndex === childFields.length - 1 ? { borderRight: '0' } : null]}
							>
								{formatPdfValue(row?.[child.key])}
							</Text>
						))}
					</View>
				))}
			</View>
		</View>
	);
};

const PdfDocument = ({ intervention, template }: { intervention: IMedsenseIntervention; template: IMedsenseDocumentationTemplate }) => {
	const values = intervention.documentationValues || {};
	const followUp = intervention.followUp || {};
	const prescriptions = intervention.prescriptions || [];
	const docTitle = template.pdfConfig?.documentTitle || template.label;
	const patientDisplayName = values.patient_name || values.patient_username || intervention.patientUserId || 'Unknown';

	return (
		<Document>
			<Page size='A4' style={styles.page}>
				<Text style={styles.header}>{docTitle}</Text>

				<View style={styles.meta}>
					<View style={styles.metaItem}>
						<Text style={styles.label}>Patient</Text>
						<Text style={styles.value}>{patientDisplayName}</Text>
						<Text style={styles.label}>Date</Text>
						<Text style={styles.value}>{new Date(intervention.createdAt).toLocaleDateString()}</Text>
					</View>
					<View style={styles.metaItem}>
						<Text style={styles.label}>Completed By</Text>
						<Text style={styles.value}>{intervention.finalizedBy?.username || '-'}</Text>
						<Text style={styles.label}>Status</Text>
						<Text style={styles.value}>{intervention.documentationStatus?.toUpperCase()}</Text>
					</View>
				</View>

				{template.sections
					?.filter((section) => section.visibleInPdf !== false && section.type !== 'signatures')
					.map((section) => (
						<View key={section.key} style={styles.section}>
							<Text style={styles.sectionTitle}>{section.title}</Text>
							{section.type === 'prescriptions' ? (
								prescriptions.length ? (
									prescriptions.map((prescription: Record<string, any>, prescriptionIndex: number) => (
										<View key={`prescription-${prescriptionIndex}`} style={{ marginBottom: 8 }}>
											<Text style={{ fontSize: 11, marginBottom: 4 }}>Prescription {prescriptionIndex + 1}</Text>
											{section.fields
												?.filter((field) => field.visibleInPdf !== false)
												.map((field) => (
													<View key={`${field.key}-${prescriptionIndex}`} style={styles.fieldRow}>
														<Text style={styles.fieldLabel}>{field.label}:</Text>
														<Text style={styles.fieldValue}>
															{prescription?.[field.key] !== undefined ? String(prescription[field.key]) : '-'}
														</Text>
													</View>
												))}
										</View>
									))
								) : (
									<Text>-</Text>
								)
							) : section.type === 'follow_up' ? (
								section.fields
									?.filter((field) => field.visibleInPdf !== false)
									.map((field) =>
										field.type === 'repeater' ? (
											<View key={field.key}>
												{renderRepeaterField(field, Array.isArray(followUp[field.key]) ? followUp[field.key] : [])}
											</View>
										) : (
											<View key={field.key} style={styles.fieldRow}>
												<Text style={styles.fieldLabel}>{field.label}:</Text>
												<Text style={styles.fieldValue}>{formatPdfValue(followUp[field.key])}</Text>
											</View>
										),
									)
							) : (
								section.fields
									?.filter((field) => field.visibleInPdf !== false)
									.map((field) =>
										field.type === 'repeater' ? (
											<View key={field.key}>{renderRepeaterField(field, Array.isArray(values[field.key]) ? values[field.key] : [])}</View>
										) : (
											<View key={field.key} style={styles.fieldRow}>
												<Text style={styles.fieldLabel}>{field.label}:</Text>
												<Text style={styles.fieldValue}>{formatPdfValue(values[field.key])}</Text>
											</View>
										),
									)
							)}
						</View>
					))}

				{(intervention.signatures?.pharmacist || intervention.signatures?.patient) && (
					<View style={styles.signatures}>
						<Text style={{ fontSize: 12, fontWeight: 'bold' }}>Signatures</Text>
						<View style={styles.signatureRow}>
							{intervention.signatures?.pharmacist && (
								<View style={styles.signatureBlock}>
									<Text style={styles.label}>Pharmacist Signature</Text>
									{intervention.signatures.pharmacist.signatureImageData && (
										<Image style={styles.signatureImage} src={intervention.signatures.pharmacist.signatureImageData} />
									)}
									<Text style={styles.signatureName}>{intervention.signatures.pharmacist.name}</Text>
									<Text style={{ fontSize: 9, textAlign: 'center', marginTop: 2 }}>
										{new Date(intervention.signatures.pharmacist.signedAt).toLocaleString()}
									</Text>
								</View>
							)}
							{intervention.signatures?.patient && (
								<View style={styles.signatureBlock}>
									<Text style={styles.label}>Patient Signature</Text>
									{intervention.signatures.patient.signatureImageData && (
										<Image style={styles.signatureImage} src={intervention.signatures.patient.signatureImageData} />
									)}
									<Text style={styles.signatureName}>{intervention.signatures.patient.name}</Text>
									<Text style={{ fontSize: 9, textAlign: 'center', marginTop: 2 }}>
										{new Date(intervention.signatures.patient.signedAt).toLocaleString()}
									</Text>
								</View>
							)}
						</View>
					</View>
				)}

				{template.pdfConfig?.showTemplateVersion && (
					<Text style={styles.footer} fixed>
						Template: {template.key} v{template.version} | Generated on {new Date().toLocaleString()}
					</Text>
				)}
			</Page>
		</Document>
	);
};

export const downloadInterventionDocumentationPdf = async (
	intervention: IMedsenseIntervention,
	template: IMedsenseDocumentationTemplate,
) => {
	const url = await buildInterventionDocumentationPdfUrl(intervention, template);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `Document_${template.key}_${Date.now()}.pdf`;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
};

export const buildInterventionDocumentationPdfUrl = async (
	intervention: IMedsenseIntervention,
	template: IMedsenseDocumentationTemplate,
) => {
	const blob = await pdf(<PdfDocument intervention={intervention} template={template} />).toBlob();
	return URL.createObjectURL(blob);
};
