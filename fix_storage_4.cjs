const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(/\} catch \(error: any\) \{\s*console\.warn\('\[Storage\] Failed to save vendor[\s\S]*?return newVendor;\s*\},\s*\n/g, '');
code = code.replace(/\s*\/\/ Trigger asynchronous email confirmation\s*sendConfirmationEmail\('vendor', newVendor\);\s*return newVendor;\s*\},/g, '');
fs.writeFileSync('src/lib/storage.ts', code);
