const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPage.tsx', 'utf8');
code = code.replace(/const vendors = await storage.getVendorApplications\(\);\n\s*const vendorMatch = vendors.find.*?\n\s*if \(vendorMatch\) \{[\s\S]*?\} else \{/g, '');
code = code.replace(/\}\s*\} catch/g, '} catch'); // remove extra closing braces
fs.writeFileSync('src/components/LoginPage.tsx', code);
