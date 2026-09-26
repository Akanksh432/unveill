const fs = require('fs');
const path = require('path');

const walk = function(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
};

const files = walk('C:/Users/soumya/Downloads/Unveil/Unveil/src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Component imports & paths
    content = content.replace(/components\/bankguard/g, 'components/unveil');
    content = content.replace(/BankGuardLogo/g, 'UnveilLogo');
    
    // Exact terms to replace with UNVEIL
    content = content.replace(/BankGuard 360/g, 'UNVEIL');
    content = content.replace(/BankGuard360/g, 'UNVEIL');
    content = content.replace(/BankGuard/g, 'UNVEIL');
    content = content.replace(/BG360/g, 'UNVEIL');
    content = content.replace(/bankguard-summary/g, 'unveil-summary');

    // Make sure we also cover lowercase "bankguard" for generic comments or ids, but avoid component paths which we already replaced
    // Since we already replaced 'components/bankguard', we can safely replace 'bankguard' with 'unveil'
    content = content.replace(/bankguard/g, 'unveil');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
