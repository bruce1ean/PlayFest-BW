const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');
code = code.replace(/const \[vendor.*?useState.*?;/g, '');
code = code.replace(/const handleVendorSubmit[\s\S]*?addToast.*?error'\);\n    \}\n  \}/, '');
fs.writeFileSync('src/components/RegistrationForm.tsx', code);
