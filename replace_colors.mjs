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
    
    // Replace google red with gray/slate
    content = content.replace(/google-red/g, 'slate-600');
    content = content.replace(/bg-red-50/g, 'bg-slate-50');
    content = content.replace(/border-red-200/g, 'border-slate-200');
    content = content.replace(/border-red-100/g, 'border-slate-100');
    content = content.replace(/text-red-500/g, 'text-slate-500');
    content = content.replace(/text-red-800/g, 'text-slate-800');

    // Replace google green with blue/sky
    content = content.replace(/text-google-green/g, 'text-blue-600');
    content = content.replace(/bg-google-green/g, 'bg-blue-600');
    content = content.replace(/ring-google-green/g, 'ring-blue-600');
    content = content.replace(/bg-green-50/g, 'bg-blue-50');
    content = content.replace(/border-green-200/g, 'border-blue-200');
    content = content.replace(/border-green-100/g, 'border-blue-100');
    content = content.replace(/hover:bg-\[#2c9046\]/g, 'hover:bg-blue-700');

    // Replace google yellow with sky/cyan
    content = content.replace(/text-google-yellow/g, 'text-sky-600');
    content = content.replace(/bg-google-yellow/g, 'bg-sky-600');
    content = content.replace(/bg-yellow-50/g, 'bg-sky-50');
    content = content.replace(/border-yellow-200/g, 'border-sky-200');
    content = content.replace(/text-yellow-800/g, 'text-sky-800');
    content = content.replace(/text-yellow-700/g, 'text-sky-700');
    content = content.replace(/bg-yellow-100/g, 'bg-sky-100');
    content = content.replace(/ring-yellow-200/g, 'ring-sky-200');

    // Replace orange with slate (for podium)
    content = content.replace(/text-orange-800/g, 'text-slate-800');
    content = content.replace(/bg-orange-100/g, 'bg-slate-100');
    content = content.replace(/ring-orange-200/g, 'ring-slate-200');

    // Make google-blue nice standard blue 
    content = content.replace(/google-blue/g, 'blue-600');
    content = content.replace(/google-blue-hover/g, 'blue-700');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});

