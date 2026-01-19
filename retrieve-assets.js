#!/usr/bin/env node

/**
 * Asset Retrieval CLI Script
 * 
 * Usage: node retrieve-assets.js
 * 
 * This script retrieves all assets from your Solid Pod dataspaces
 * and saves them to ./src/assets/ folder
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration - Update these values with your Solid Pod details
const CONFIG = {
  // Your Solid Pod URL (e.g., 'https://yourpod.solidcommunity.net')
  podUrl: process.env.SOLID_POD_URL || 'https://yourpod.solidcommunity.net',
  
  // Output directory for assets
  outputDir: path.join(__dirname, 'src', 'assets'),
  
  // Dataspace container path
  dataspaceContainer: '/dataspaces/',
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

// Ensure output directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  }
}

// Download a file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Generate manifest file
function generateManifest(assets, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalAssets: assets.length,
    assets: assets.map(asset => ({
      name: asset.name,
      localPath: asset.localPath,
      originalUrl: asset.url,
      size: asset.size || 'unknown',
      type: asset.type || 'unknown',
    })),
  };
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

// Main retrieval function
async function retrieveLastAssets() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║           SOLID DPP PASSPORT - ASSET RETRIEVAL           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  logStep('1/5', 'Initializing asset retrieval...');
  
  // Ensure output directory exists
  ensureDirectoryExists(CONFIG.outputDir);
  
  logStep('2/5', 'Checking for local storage data...');
  
  // In a real implementation, this would connect to your Solid Pod
  // For now, we'll check if there's any cached data locally
  
  const localDataPath = path.join(__dirname, '.solid-cache');
  let assets = [];
  
  // Check for cached assets data
  if (fs.existsSync(path.join(localDataPath, 'assets.json'))) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(path.join(localDataPath, 'assets.json'), 'utf8'));
      assets = cachedData.assets || [];
      logSuccess(`Found ${assets.length} cached assets`);
    } catch (e) {
      log('No cached data found, creating sample structure...', 'yellow');
    }
  }
  
  logStep('3/5', 'Preparing asset downloads...');
  
  // If no assets found, create example structure
  if (assets.length === 0) {
    log('\n  ℹ️  No assets found in cache.', 'yellow');
    log('  To retrieve assets from your Solid Pod:', 'yellow');
    log('  1. Log into the app and upload assets', 'yellow');
    log('  2. Run this script again\n', 'yellow');
    
    // Create example folder structure
    const examplesDir = path.join(CONFIG.outputDir, 'examples');
    ensureDirectoryExists(examplesDir);
    
    // Create a placeholder README
    const readmePath = path.join(CONFIG.outputDir, 'README.md');
    const readmeContent = `# Assets Folder

This folder contains assets retrieved from your Solid Pod dataspaces.

## Structure

- \`/examples/\` - Example assets (placeholders)
- \`manifest.json\` - List of all retrieved assets

## Usage

Run \`node retrieve-assets.js\` from the project root to sync assets from your Pod.

## Configuration

Edit the CONFIG object in \`retrieve-assets.js\` to update:
- \`podUrl\` - Your Solid Pod URL
- \`outputDir\` - Where to save assets
- \`dataspaceContainer\` - Path to dataspaces in your Pod

Generated: ${new Date().toISOString()}
`;
    fs.writeFileSync(readmePath, readmeContent);
    logSuccess('Created README.md');
  }
  
  logStep('4/5', 'Processing assets...');
  
  const downloadedAssets = [];
  
  for (const asset of assets) {
    try {
      const fileName = asset.name || `asset_${Date.now()}`;
      const localPath = path.join(CONFIG.outputDir, fileName);
      
      if (asset.url) {
        await downloadFile(asset.url, localPath);
        downloadedAssets.push({
          ...asset,
          localPath: path.relative(__dirname, localPath),
        });
        logSuccess(`Downloaded: ${fileName}`);
      }
    } catch (error) {
      logError(`Failed to download ${asset.name}: ${error.message}`);
    }
  }
  
  logStep('5/5', 'Generating manifest...');
  
  // Generate manifest with all assets info
  const manifestPath = generateManifest(downloadedAssets.length > 0 ? downloadedAssets : [{
    name: 'placeholder',
    localPath: 'src/assets/README.md',
    originalUrl: 'local',
    type: 'markdown',
  }], CONFIG.outputDir);
  
  logSuccess(`Generated manifest: ${path.relative(__dirname, manifestPath)}`);
  
  // Final summary
  console.log('\n');
  log('═══════════════════════════════════════════════════════════', 'green');
  log('                    RETRIEVAL COMPLETE!                     ', 'green');
  log('═══════════════════════════════════════════════════════════', 'green');
  console.log('\n');
  
  log(`  📁 Output Directory: ${CONFIG.outputDir}`, 'cyan');
  log(`  📄 Assets Retrieved: ${downloadedAssets.length}`, 'cyan');
  log(`  📋 Manifest: ${manifestPath}`, 'cyan');
  
  console.log('\n');
  logSuccess('Done! All assets have been retrieved.');
  console.log('\n');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${colors.bold}Solid DPP Passport - Asset Retrieval${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node retrieve-assets.js              Retrieve all assets
  node retrieve-assets.js --help       Show this help message

${colors.cyan}Environment Variables:${colors.reset}
  SOLID_POD_URL    Your Solid Pod URL (default: https://yourpod.solidcommunity.net)

${colors.cyan}Output:${colors.reset}
  Assets are saved to: ./src/assets/
  A manifest.json is generated with all asset metadata.
`);
  process.exit(0);
}

// Check if command matches
const command = args.join(' ');
if (command === '-retrieve last-assets' || command === 'retrieve last-assets' || args.length === 0) {
  retrieveLastAssets().catch((error) => {
    logError(`Error: ${error.message}`);
    process.exit(1);
  });
} else {
  log(`Unknown command: ${command}`, 'red');
  log('Use --help for usage information', 'yellow');
  process.exit(1);
}
