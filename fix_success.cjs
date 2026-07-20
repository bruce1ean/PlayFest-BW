const fs = require('fs');
let code = fs.readFileSync('src/components/SuccessPage.tsx', 'utf8');
code = code.replace(/if \(registrationType === 'vendor'\) \{[\s\S]*?\} else \{/g, '');
code = code.replace(/registrationType === 'vendor' \?[\s\S]*?:/g, '');
fs.writeFileSync('src/components/SuccessPage.tsx', code);
