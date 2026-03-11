import fs from 'fs';
import path from 'path';

function walkPath(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkPath(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkPath('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(/blue-600-hover/g, 'blue-700');
    content = content.replace(/hover:bg-\[#d93025\]/g, 'hover:bg-slate-700');
    content = content.replace(/hover:bg-red-100/g, 'hover:bg-slate-100');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});

