import { addMigration } from '../../lib/migrations';

addMigration({
    version: 334,
    name: 'Create medsense_patient_context collection (indexes created by model)',
    async up() {
        // No-op: collection and indexes are created automatically by the
        // MedsensePatientContextRaw model on startup.
        // Legacy customFields.patientProfile is fully abandoned.
    },
});
