const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
code = code.replace(/\{ id: 'vendors', label: `Stall bookings \[\$\{totalVendors\}\]`, icon: <Store className="w-4 h-4" \/> \},/g, '');
code = code.replace(/\| 'vendors'/g, '');
code = code.replace(/const totalVendors = .*?;/g, '');
code = code.replace(/<div className="text-\[10px\].*?Food \/ Brand Vendors<\/div>\s*<div className="text-2xl.*?\{totalVendors\}<\/div>/g, '');
code = code.replace(/\{\/\* VENDORS APPLICATIONS TAB \*\/\}\s*\{activeSubTab === 'vendors'[\s\S]*?\}\)/, '');
code = code.replace(/\} else if \(type === 'vendors'\) \{[\s\S]*?filename = `PlayFest2026_Vendors/g, 'filename = `PlayFest2026_Vendors'); // Hacky, let's do a better replace
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
