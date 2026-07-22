import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'format:check']);
run('npm', ['run', 'lint']);
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'test']);
run('npm', ['run', 'build']);
console.log('\nFoundation verification passed.');
