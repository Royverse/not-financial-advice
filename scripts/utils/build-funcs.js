import * as esbuild from 'esbuild';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

async function buildFunctions() {
    console.log('📦 Building Netlify Functions...');

    // Ensure output directory exists
    const outDir = 'netlify/functions-dist';
    if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outDir, { recursive: true });

    // Find all function files
    const entryPoints = await glob('netlify/functions/**/*.mts');

    if (entryPoints.length === 0) {
        console.warn('⚠️ No functions found in netlify/functions/**/*.mts');
        return;
    }

    console.log(`Found ${entryPoints.length} functions to build:`);
    entryPoints.forEach(f => console.log(` - ${f}`));

    try {
        // Generate build options for each file to allow custom naming
        // We want netlify/functions/api/foo.mts -> netlify/functions-dist/api-foo.js
        // and netlify/functions/scheduled-scan.mts -> netlify/functions-dist/scheduled-scan.js

        const buildPromises = entryPoints.map(entry => {
            const relPath = path.relative('netlify/functions', entry);
            const name = relPath.replace(/\.mts$/, '').replace(/[\\/]/g, '-');
            const outFile = path.join(outDir, `${name}.js`);

            return esbuild.build({
                entryPoints: [entry],
                bundle: true,
                platform: 'node',
                target: 'node18',
                outfile: outFile,
                format: 'esm',
                sourcemap: true,
                external: ['@supabase/supabase-js', 'axios'], // Keep external if possible, or bundle if causing issues. Netlify modern functions handle bundle well.
                bundle: true,
                minify: true,
            });
        });

        await Promise.all(buildPromises);

        console.log('✅ Functions built successfully to netlify/functions-dist (FLATTENED)');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

buildFunctions();
