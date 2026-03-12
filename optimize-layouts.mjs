import fs from 'fs'

const files = [
    {
        path: 'src/app/dashboard/participant/layout.tsx',
        role: 'participant',
        headerText: 'Welcome, '
    },
    {
        path: 'src/app/dashboard/organizer/layout.tsx',
        role: 'organizer',
        headerText: 'Organizer Panel'
    },
    {
        path: 'src/app/dashboard/judge/layout.tsx',
        role: 'judge',
        headerText: 'Judge Panel'
    }
];

files.forEach(({ path, role, headerText }) => {
    let content = fs.readFileSync(path, 'utf8');

    // Remove the DB query and the redirect check using userData
    const dbQueryPattern = `    const { data: userData } = await supabase\n        .from('users')\n        .select('*')\n        .eq('id', user.id)\n        .single()\n\n    if (userData?.role !== '${role}') {\n        redirect(\`/dashboard/\${userData?.role || 'participant'}\`)\n    }`;
    
    // Replace with just the role check using the user session directly
    const newCheck = `    if (user?.role !== '${role}') {\n        redirect(\`/dashboard/\${user?.role || 'participant'}\`)\n    }`;
    
    content = content.replace(dbQueryPattern, newCheck);

    // Replace userData?.name with user?.name in the header
    if (role === 'participant') {
        content = content.replace(/\{userData\?.name \|\| 'Participant'\}/g, "{user?.name || 'Participant'}");
        content = content.replace(/\{userData\?.name\?.charAt\(0\).toUpperCase\(\) \|\| 'P'\}/g, "{user?.name?.charAt(0).toUpperCase() || 'P'}");
    } else if (role === 'organizer') {
        content = content.replace(/\{userData\?.name\?.charAt\(0\).toUpperCase\(\) \|\| 'O'\}/g, "{user?.name?.charAt(0).toUpperCase() || 'O'}");
    } else if (role === 'judge') {
        content = content.replace(/\{userData\?.name\?.charAt\(0\).toUpperCase\(\) \|\| 'J'\}/g, "{user?.name?.charAt(0).toUpperCase() || 'J'}");
    }

    // Remove the unused supabase instantiation
    content = content.replace(/    const supabase = await createClient\(\)\n/g, '');
    
    // Remove the unused createClient import
    content = content.replace(/import \{ createClient \} from '@\/utils\/supabase\/server'\n/g, '');

    fs.writeFileSync(path, content, 'utf8');
    console.log(`Optimized ${path}`);
});
