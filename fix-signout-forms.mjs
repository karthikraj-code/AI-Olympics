import fs from 'fs'

const files = [
  'src/app/dashboard/participant/layout.tsx',
  'src/app/dashboard/organizer/layout.tsx',
  'src/app/dashboard/judge/layout.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Remove the form
  content = content.replace(
      /<form action="\/auth\/signout" method="post">[\s\S]*?<\/form>/,
      '<SignOutButton />'
  );

  // 2. We already inserted the import on line 8/7/8 previously, but if we haven't:
  if (!content.includes('SignOutButton')) {
      content = content.replace(/import { LogOut/, "import SignOutButton from '@/components/SignOutButton'\nimport { LogOut");
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced signout form in', file);
});
