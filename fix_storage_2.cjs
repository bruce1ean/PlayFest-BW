const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');
code = code.replace(/\/\/ GET Vendor Applications[\s\S]*?async getNewsletterSubscribers/g, '// GET Newsletter Subscribers\n  async getNewsletterSubscribers');
fs.writeFileSync('src/lib/storage.ts', code);
