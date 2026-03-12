import fs from 'fs'
import path from 'path'

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file)
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, filelist)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      filelist.push(filepath)
    }
  })
  return filelist
}

walkSync('src/app').forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  if (content.includes('const user = session?.user') && !content.includes('const user = session?.user as any')) {
    content = content.replace(/const user = session\?\.user/g, 'const user = session?.user as any')
    fs.writeFileSync(file, content, 'utf8')
    console.log('Casted user to any in', file)
  }
})
