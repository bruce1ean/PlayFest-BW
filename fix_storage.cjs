const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(/async saveVendorApplication[\s\S]*?async getVendorApplications/g, 'async getVendorApplications');
code = code.replace(/async getVendorApplications.*?\{[\s\S]*?\}/g, '');
fs.writeFileSync('src/lib/storage.ts', code);
