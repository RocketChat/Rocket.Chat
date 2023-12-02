/**
 * This script will:
 *
 * - remove any duplicated i18n key on the same file;
 * - re-order all keys based on source i18n file (en.i18n.json)
 * - remove all keys not present in source i18n file
 */

const fs = require('fs').promises;
const path = require('path');
const fg = require('fast-glob');

const fixFiles = async (dirPath, sourceFileName, newlineAtEnd = false) => {
    try {
        const sourceFilePath = path.join(dirPath, sourceFileName);
        const sourceFileContent = await fs.readFile(sourceFilePath, 'utf8');
        const sourceKeys = Object.keys(JSON.parse(sourceFileContent));

        const entries = await fg([path.join(dirPath, '**/*.i18n.json')]);

        await Promise.all(
            entries.map(async (file) => {
                try {
                    const jsonContent = await fs.readFile(file, 'utf8');
                    await fs.writeFile(file, `${JSON.stringify(JSON.parse(jsonContent), null, 2)}${newlineAtEnd ? '\n' : ''}`);
                } catch (writeError) {
                    console.error(`Error writing to file ${file}: ${writeError.message}`);
                }
            })
        );

        console.log('Fixing files completed successfully.');
    } catch (error) {
        console.error('Error fixing files:', error.message);
    }
};

// Example usage
fixFiles('./packages/rocketchat-i18n', '/i18n/en.i18n.json');

