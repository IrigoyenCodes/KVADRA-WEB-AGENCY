import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

const outdir = 'dist';

async function build() {
  // Clean the output directory
  await fs.rm(outdir, { recursive: true, force: true });
  await fs.mkdir(outdir);

  // Run esbuild
  await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    outfile: `${outdir}/bundle.js`,
    jsx: 'automatic',
    loader: { '.tsx': 'tsx' },
    define: {
      'process.env.API_KEY': `"${process.env.API_KEY || ''}"`
    },
    logLevel: 'info',
  }).catch(() => process.exit(1));

  // Find all .html, .css, .txt, .xml files and copy them to the dist folder
  const files = await fs.readdir('.');
  for (const file of files) {
    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.txt') || file.endsWith('.xml')) {
      await fs.copyFile(file, path.join(outdir, file));
    }
  }

  // Update index.html to use the bundled script
  const indexPath = path.join(outdir, 'index.html');
  let indexHtml = await fs.readFile(indexPath, 'utf-8');
  indexHtml = indexHtml.replace(/<script type="importmap">[\s\S]*?<\/script>/, ''); // Remove importmap
  indexHtml = indexHtml.replace(/<script type="module" src="\/index.tsx"><\/script>/, '<script src="/bundle.js" defer></script>'); // Replace script tag
  await fs.writeFile(indexPath, indexHtml);

  console.log('Build finished successfully!');
}

build();