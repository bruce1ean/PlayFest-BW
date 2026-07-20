const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(/const localVendors = getLocalData.*?;/g, '');
code = code.replace(/localVendors: localVendors/g, '');
code = code.replace(/async function saveVendorToGoogleSheets[\s\S]*?async function saveFeedbackToGoogleSheets/g, 'async function saveFeedbackToGoogleSheets');
code = code.replace(/\/\/ GET Vendor Applications[\s\S]*?\/\/ GET Newsletter Subscribers/g, '// GET Newsletter Subscribers');
fs.writeFileSync('src/lib/storage.ts', code);
