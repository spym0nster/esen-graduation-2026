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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./components');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if(content.includes('ease: [0.22, 1, 0.36, 1]')) {
    fs.writeFileSync(f, content.replace(/ease: \[0.22, 1, 0.36, 1\]/g, 'ease: [0.22, 1, 0.36, 1] as any'));
    console.log('Fixed', f);
  }
});
