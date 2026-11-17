// Tailwind CSS 다시 만들기 — 탐지기 / EXP / 가챠 / 코스튬 슬롯 페이지용
// 이 페이지들의 HTML·JS에 새 Tailwind 클래스(예: mt-3, grid-cols-4)를 넣었을 때만 실행하면 됩니다.
//
//   frontend 폴더에서:  node assets/css/tw/build.mjs
//
// (Node.js 필요. 처음 실행할 때 tailwindcss@3.4.17 을 자동으로 받습니다. 예전 CDN과 같은 버전)
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// PATH 설정과 상관없이 돌도록, 지금 실행 중인 node 와 그 옆의 npx 를 직접 씀
const nodeDir = dirname(process.execPath);
const npxCli = join(nodeDir, 'node_modules', 'npm', 'bin', 'npx-cli.js');
const env = { ...process.env, PATH: `${nodeDir}${delimiter}${process.env.PATH || ''}` };
const root = join(here, '..', '..', '..'); // frontend 폴더

// 페이지 → 그 페이지의 클래스가 들어 있는 파일들
const PAGES = {
  detector: ['detector.html', 'app/detector.js', 'app/detector-admin.js', 'app/admin-core.js', 'app/referral-float.js'],
  exp: ['exp.html', 'app/exp.js', 'app/referral-float.js'],
  gacha: ['gacha.html', 'app/gacha.js', 'app/gacha-presentation-assets.js', 'app/gacha-presentation.js', 'app/referral-float.js'],
  'costume-slot': ['costume-slot.html', 'app/costume-slot.js', 'app/referral-float.js'],
};

for (const [page, files] of Object.entries(PAGES)) {
  const content = files.map((f) => join(root, f).replace(/\\/g, '/')).join(',');
  const out = join(here, `${page}.css`);
  const args = ['--yes', 'tailwindcss@3.4.17', '-c', join(here, 'tailwind.config.js'), '-i', join(here, 'input.css'), '-o', out, '--content', content, '--minify'];
  if (existsSync(npxCli)) execFileSync(process.execPath, [npxCli, ...args], { stdio: 'inherit', cwd: root, env });
  else execFileSync('npx', args, { stdio: 'inherit', cwd: root, env, shell: true });
  console.log(`✔ ${page}.css`);
}
