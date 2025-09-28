import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

// Promisify the zlib function for async/await usage
const brotliCompress = promisify(zlib.brotliCompress);

// --- Environment Setup ---
const isProduction = process.env.NODE_ENV === 'production';
const analyzeBundle = process.env.ANALYZE === 'true';
const outdir = 'dist';

// --- esbuild Plugins ---

/**
 * A custom esbuild plugin to compress JS and CSS assets using Brotli.
 * This runs only in production builds after the main bundling is complete.
 */
const brotliCompressionPlugin = {
  name: 'brotli-compression',
  setup(build) {
    build.onEnd(async (result) => {
      if (!isProduction || !result.metafile) {
        return;
      }

      console.log('\n📦 Compressing assets with Brotli...');
      const outputFiles = Object.keys(result.metafile.outputs);
      const compressionTasks = [];

      for (const filePath of outputFiles) {
        // Only compress key text-based assets
        if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.svg')) {
          const task = async () => {
            const fullPath = path.resolve(filePath);
            const fileBuffer = await fs.readFile(fullPath);
            
            try {
              const compressed = await brotliCompress(fileBuffer);
              await fs.writeFile(`${fullPath}.br`, compressed);

              const originalSize = (fileBuffer.length / 1024).toFixed(2);
              const compressedSize = (compressed.length / 1024).toFixed(2);
              console.log(`   - ${filePath}: ${originalSize}KB -> ${compressedSize}KB`);
            } catch (err) {
              console.error(`Error compressing ${filePath}:`, err);
            }
          };
          compressionTasks.push(task());
        }
      }
      await Promise.all(compressionTasks);
      console.log('✅ Compression complete.\n');
    });
  }
};


// --- Main Build Function ---
async function build() {
  try {
    console.log(`🚀 Starting build for ${isProduction ? 'production' : 'development'} environment...`);

    // 1. Clean the output directory to ensure a fresh build
    await fs.rm(outdir, { recursive: true, force: true });
    await fs.mkdir(outdir, { recursive: true });
    
    // 2. Define the core esbuild configuration
    const options = {
      entryPoints: ['index.tsx'],
      bundle: true,
      outdir: outdir,
      jsx: 'automatic',
      loader: { '.tsx': 'tsx' },
      define: {
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      plugins: [],
      metafile: true, // Required for analysis and post-build steps
      logLevel: 'info',
    };

    // 3. Apply production-specific optimizations
    if (isProduction) {
      Object.assign(options, {
        splitting: true,            // Enable code splitting
        format: 'esm',              // Output ES Modules
        entryNames: 'assets/[name]-[hash]',
        chunkNames: 'chunks/[name]-[hash]',
        assetNames: 'assets/[name]-[hash]',
        minify: true,               // Minify code
        sourcemap: false,           // Disable sourcemaps for production
        treeShaking: true,          // Enable tree shaking to remove dead code
        legalComments: 'none',      // Remove license comments
        mangleProps: /^_/,          // Mangle properties starting with _
        pure: ['console.log'],      // Remove console.log calls
      });
      options.plugins.push(brotliCompressionPlugin);
    } else {
      // Apply development-specific settings
      options.sourcemap = 'inline'; // Fast inline sourcemaps for debugging
    }

    // 4. Execute the esbuild process
    const result = await esbuild.build(options);
    console.log('✅ esbuild process complete.');

    // 5. Copy all static assets to the output directory
    const staticFiles = await fs.readdir('.');
    const copyTasks = staticFiles
      .filter(file => file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.txt') || file.endsWith('.xml'))
      .map(file => fs.copyFile(file, path.join(outdir, file)));
    await Promise.all(copyTasks);
    console.log('✅ Static files copied.');

    // 6. Update index.html to point to the new, hashed JS bundle from the metafile
    const entryPointOutput = Object.keys(result.metafile.outputs).find(
        (output) => result.metafile.outputs[output].entryPoint === 'index.tsx'
    );
    
    if (entryPointOutput) {
      const scriptPath = `/${path.relative(outdir, entryPointOutput).replace(/\\/g, '/')}`;
      const indexPath = path.join(outdir, 'index.html');
      let indexHtml = await fs.readFile(indexPath, 'utf-8');
      
      // Clean up old script tags and add the new one
      indexHtml = indexHtml.replace(/<script type="importmap">[\s\S]*?<\/script>/s, '');
      indexHtml = indexHtml.replace(/<script type="module" src="\/index.tsx"><\/script>/, '');
      indexHtml = indexHtml.replace('</body>', `    <script src="${scriptPath}" defer></script>\n  </body>`);
      
      await fs.writeFile(indexPath, indexHtml);
      console.log(`✅ index.html updated to use script: ${scriptPath}`);
    } else {
      console.warn('⚠️ Could not find entry point in metafile to update index.html.');
    }

    // 7. If requested, analyze the bundle and print the report
    if (analyzeBundle) {
      const analysis = await esbuild.analyzeMetafile(result.metafile, { color: true });
      console.log('\n📊 Bundle Analysis:\n' + analysis);
    }

    console.log('\n🎉 Build finished successfully!');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build process
build();