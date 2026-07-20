const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(/console\.log\('\[Storage\/Google Sheets\] Vendor successfully backed up to Google Sheets:', newVendor\.id\);\s*\} catch \(error: any\) \{\s*console\.warn\('\[Storage\/Google Sheets\] Failed to connect to Google Sheets vendor backup endpoint:', error\.message \|\| error\);\s*\}/, '');
code = code.replace(/async function sendConfirmationEmail\(type: 'attendee' \| 'vendor' \| 'subscriber', data: any\) \{/g, "async function sendConfirmationEmail(type: 'attendee' | 'subscriber', data: any) {");
code = code.replace(/const newVendor: VendorApplication = \{[\s\S]*?console\.log\('Saved vendor to Google Sheets successfully:', newVendor\.id\);/g, '');
fs.writeFileSync('src/lib/storage.ts', code);
