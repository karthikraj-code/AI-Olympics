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
  
  if (content.includes("'use client'") || content.includes('"use client"')) {
    let modified = false;

    // Use getSession in client components, not getServerSession
    if (content.includes('getServerSession')) {
      content = content.replace(/import \{ getServerSession \} from "next-auth"/g, 'import { getSession } from "next-auth/react"')
      content = content.replace(/await getServerSession\(authOptions\)/g, 'await getSession()')
      content = content.replace(/import \{ authOptions \} from "@\/lib\/auth"\n/g, '')
      modified = true;
    }

    // Force 'use client' to be the absolute first line
    const match = content.match(/('use client'|"use client");?\n+/);
    if (match && content.indexOf(match[0]) !== 0) {
      // Remove it from current location
      content = content.replace(match[0], '');
      // Prepend to top
      content = "'use client'\n" + content;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8')
      console.log('Repaired client component:', file)
    }
  }
})
