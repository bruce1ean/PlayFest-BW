const fs = require('fs');
let code = fs.readFileSync('src/mockData.ts', 'utf8');
code = code.replace(/vendors: VendorApplication\[\];/g, '');
code = code.replace(/\/\/ Generate 8 realistic vendor applications[\s\S]*?const subscribers: NewsletterSubscriber\[\] = \[/g, 'const subscribers: NewsletterSubscriber[] = [');
code = code.replace(/return \{ registrations, vendors, subscribers \};/g, 'return { registrations, subscribers };');
code = code.replace(/vendors,\s*/g, '');
fs.writeFileSync('src/mockData.ts', code);
