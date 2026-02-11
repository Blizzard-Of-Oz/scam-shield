import { writeFileSync } from 'node:fs';

const output = `// Placeholder generated file for environments without prisma client generation.\n`;
writeFileSync('prisma/.generated-note', output);
console.log('Database client generation placeholder completed.');
