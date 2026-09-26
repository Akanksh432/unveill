const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/LN-/g, 'UNV-');
  content = content.replace(/loan application/gi, 'verification case');
  content = content.replace(/loan amount/gi, 'case type');
  content = content.replace(/loan/gi, 'case');
  content = content.replace(/underwriter/gi, 'forensic analyst');
  content = content.replace(/Underwriter/gi, 'Forensic Analyst');
  content = content.replace(/underwriting/gi, 'forensic analysis');
  content = content.replace(/Underwriting/gi, 'Forensic Analysis');
  content = content.replace(/amortization/gi, 'verification');
  
  // Specific data fields in cross-check / store
  content = content.replace(/payslip/g, 'idDocumentValue');
  content = content.replace(/Payslip/g, 'Primary Document (Extracted OCR)');
  
  content = content.replace(/bankStatement/g, 'kycRecordValue');
  content = content.replace(/bank statement/gi, 'KYC Record');
  content = content.replace(/Bank Statement/g, 'Database KYC Master Record');
  
  content = content.replace(/taxReturn/g, 'secondaryDocumentValue');
  content = content.replace(/tax return/gi, 'Secondary Document');
  content = content.replace(/Tax Return/g, 'Secondary Validation Source');

  content = content.replace(/FullApplication/g, 'ForensicVerificationCase');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
