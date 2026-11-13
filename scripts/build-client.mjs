// Builds the site for Catalyst Cloud Scale web-client hosting, which serves it under /app/
// (https://pankaj.2026.co.in → /app/). Output goes to client/ with the client-package.json Catalyst needs.
// Run: npm run build:client   then   catalyst deploy --only client
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const result = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/app', OUT_DIR: './client' },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Catalyst requires a version that only ever goes up — minutes since epoch keeps it monotonic.
const version = `1.${Math.floor(Date.now() / 60000)}`;
writeFileSync(
  'client/client-package.json',
  JSON.stringify(
    {
      name: 'pankaj-portfolio',
      version,
      homepage: 'index.html',
      description: 'Pankaj Parihar - portfolio',
      404: '404.html',
    },
    null,
    2,
  ) + '\n',
);
console.log(`client/ ready (version ${version})`);
