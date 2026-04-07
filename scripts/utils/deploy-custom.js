const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Starting Custom Deployment...');

try {
    // 1. Build Next.js (Static Export)
    console.log('\n🏗️  Building Next.js Frontend...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Build Netlify Functions
    console.log('\n⚡ Building Netlify Functions...');
    execSync('npm run build:functions', { stdio: 'inherit' });

    // 3. Deploy to Netlify
    console.log('\n☁️  Deploying to Netlify...');
    // We use --functions flag to explicitly point to our manual build
    // We use --dir flag to point to Next.js export output
    execSync('npx netlify-cli deploy --prod --dir=out --functions=netlify/functions-dist', { stdio: 'inherit' });

    console.log('\n✅ Deployment Complete!');
} catch (error) {
    console.error('\n❌ Deployment Failed:', error.message);
    process.exit(1);
}
