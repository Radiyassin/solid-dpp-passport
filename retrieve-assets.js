#!/usr/bin/env node

/**
 * Solid Pod Asset Retrieval CLI
 * 
 * Retrieves uploaded files from Solid Pod and saves them locally to ./DATA/
 * Mirrors the remote structure:
 *   - DATA/dpp/          ← {podUrl}/dpp/
 *   - DATA/dataspaces/   ← {podUrl}/dataspaces/{dataSpaceId}/data/
 * 
 * Usage:
 *   node retrieve-assets.js -retrieve last-assets
 *   node retrieve-assets.js -retrieve last-assets --dataspace <id>
 *   node retrieve-assets.js -retrieve last-assets --force
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Your Solid Pod URL
  podUrl: process.env.SOLID_POD_URL || 'https://solid4dpp.solidcommunity.net',
  
  // Local output directory
  outputDir: path.join(__dirname, 'DATA'),
  
  // Remote container paths
  containers: {
    dpp: '/dpp/',
    dataspaces: '/dataspaces/',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TERMINAL COLORS & LOGGING
// ═══════════════════════════════════════════════════════════════════════════

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const logStep = (step, msg) => console.log(`${colors.cyan}[${step}]${colors.reset} ${msg}`);
const logSuccess = (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`);
const logError = (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`);
const logInfo = (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
const logWarn = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);

// ═══════════════════════════════════════════════════════════════════════════
// FILE SYSTEM UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Make an HTTP request with proper headers for Solid
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Accept': options.accept || '*/*',
        ...options.headers,
      },
    };
    
    const req = protocol.request(reqOptions, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          httpRequest(redirectUrl, options).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      const chunks = [];
      const isBinary = options.binary;
      
      if (isBinary) {
        res.on('data', chunk => chunks.push(chunk));
      } else {
        res.on('data', chunk => data += chunk);
      }
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: isBinary ? Buffer.concat(chunks) : data,
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch a Solid container and get its contents as Turtle
 */
async function fetchContainer(containerUrl) {
  try {
    const response = await httpRequest(containerUrl, {
      accept: 'text/turtle',
    });
    
    if (response.statusCode === 404) {
      return { exists: false, resources: [] };
    }
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode} for ${containerUrl}`);
    }
    
    return {
      exists: true,
      turtle: response.body,
      resources: parseTurtleContainment(response.body, containerUrl),
    };
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to Pod: ${containerUrl}`);
    }
    throw error;
  }
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url, destPath, force = false) {
  if (!force && fileExists(destPath)) {
    return { skipped: true, path: destPath };
  }
  
  // Ensure directory exists
  ensureDirectoryExists(path.dirname(destPath));
  
  const response = await httpRequest(url, { binary: true });
  
  if (response.statusCode !== 200) {
    throw new Error(`Failed to download: HTTP ${response.statusCode}`);
  }
  
  fs.writeFileSync(destPath, response.body);
  
  return {
    skipped: false,
    path: destPath,
    size: response.body.length,
    contentType: response.headers['content-type'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TURTLE PARSING (Simple parser for ldp:contains)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse Turtle response to extract contained resource URLs
 * Looks for ldp:contains predicates
 */
function parseTurtleContainment(turtle, baseUrl) {
  const resources = [];
  
  // Match ldp:contains patterns
  // Pattern 1: ldp:contains <url>
  const containsPattern1 = /ldp:contains\s+<([^>]+)>/g;
  // Pattern 2: <url> a ldp:Resource (contained items)
  const resourcePattern = /<([^>]+)>\s+a\s+(?:ldp:Resource|ldp:Container)/g;
  
  let match;
  
  // Extract from ldp:contains
  while ((match = containsPattern1.exec(turtle)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (!resources.includes(url)) {
      resources.push(url);
    }
  }
  
  // Also look for stat:mtime patterns which indicate files
  const statPattern = /<([^>]+)>\s+stat:mtime/g;
  while ((match = statPattern.exec(turtle)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (!resources.includes(url) && url !== baseUrl) {
      resources.push(url);
    }
  }
  
  // Parse prefixed format: :filename a ldp:Resource
  const prefixedPattern = /:([^\s]+)\s+a\s+ldp:Resource/g;
  while ((match = prefixedPattern.exec(turtle)) !== null) {
    const filename = match[1];
    const url = resolveUrl(filename, baseUrl);
    if (!resources.includes(url)) {
      resources.push(url);
    }
  }
  
  return resources;
}

/**
 * Resolve a relative URL against a base URL
 */
function resolveUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

/**
 * Check if URL is a container (ends with /)
 */
function isContainer(url) {
  return url.endsWith('/');
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url) {
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;
  return path.basename(pathname);
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLID POD SYNC LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recursively list all files in a container
 */
async function listContainerRecursive(containerUrl, depth = 0) {
  const files = [];
  const maxDepth = 5; // Prevent infinite recursion
  
  if (depth > maxDepth) {
    logWarn(`Max depth reached at ${containerUrl}`);
    return files;
  }
  
  try {
    const container = await fetchContainer(containerUrl);
    
    if (!container.exists) {
      return files;
    }
    
    for (const resourceUrl of container.resources) {
      if (isContainer(resourceUrl)) {
        // Recurse into sub-containers
        const subFiles = await listContainerRecursive(resourceUrl, depth + 1);
        files.push(...subFiles);
      } else {
        files.push(resourceUrl);
      }
    }
  } catch (error) {
    logError(`Failed to list ${containerUrl}: ${error.message}`);
  }
  
  return files;
}

/**
 * Get relative path from Pod URL to use as local path
 */
function getLocalPath(fileUrl, podUrl, outputDir) {
  const podBase = new URL(podUrl).href;
  let relativePath = fileUrl.replace(podBase, '');
  
  // Remove leading slash
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.slice(1);
  }
  
  return path.join(outputDir, relativePath);
}

/**
 * Sync DPP files from Pod
 */
async function syncDPPFiles(podUrl, outputDir, force = false) {
  const dppContainerUrl = new URL(CONFIG.containers.dpp, podUrl).href;
  const localDppDir = path.join(outputDir, 'dpp');
  
  logStep('DPP', `Syncing from ${dppContainerUrl}`);
  ensureDirectoryExists(localDppDir);
  
  const files = await listContainerRecursive(dppContainerUrl);
  const results = [];
  
  for (const fileUrl of files) {
    const localPath = getLocalPath(fileUrl, podUrl, outputDir);
    
    try {
      const result = await downloadFile(fileUrl, localPath, force);
      results.push({
        url: fileUrl,
        localPath: path.relative(outputDir, localPath),
        type: 'dpp',
        size: result.size,
        contentType: result.contentType,
        skipped: result.skipped,
        timestamp: new Date().toISOString(),
      });
      
      if (result.skipped) {
        log(`  ${colors.dim}↷ ${getFilenameFromUrl(fileUrl)} (exists)${colors.reset}`);
      } else {
        logSuccess(`  ${getFilenameFromUrl(fileUrl)}`);
      }
    } catch (error) {
      logError(`  ${getFilenameFromUrl(fileUrl)}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Sync dataspace files from Pod
 */
async function syncDataspaceFiles(podUrl, outputDir, force = false, specificDataspace = null) {
  const dataspacesContainerUrl = new URL(CONFIG.containers.dataspaces, podUrl).href;
  const localDataspacesDir = path.join(outputDir, 'dataspaces');
  
  logStep('DATASPACES', `Syncing from ${dataspacesContainerUrl}`);
  ensureDirectoryExists(localDataspacesDir);
  
  const results = [];
  
  try {
    const container = await fetchContainer(dataspacesContainerUrl);
    
    if (!container.exists) {
      logInfo('  No dataspaces container found');
      return results;
    }
    
    // Get list of dataspaces
    const dataspaces = container.resources.filter(isContainer);
    
    for (const dataspaceUrl of dataspaces) {
      const dataspaceName = getFilenameFromUrl(dataspaceUrl.slice(0, -1)); // Remove trailing /
      
      // Skip if specific dataspace requested and this isn't it
      if (specificDataspace && dataspaceName !== specificDataspace) {
        continue;
      }
      
      log(`\n  ${colors.bold}📁 Dataspace: ${dataspaceName}${colors.reset}`);
      
      // Look for data/ subfolder
      const dataContainerUrl = new URL('data/', dataspaceUrl).href;
      const files = await listContainerRecursive(dataContainerUrl);
      
      for (const fileUrl of files) {
        const localPath = getLocalPath(fileUrl, podUrl, outputDir);
        
        try {
          const result = await downloadFile(fileUrl, localPath, force);
          results.push({
            url: fileUrl,
            localPath: path.relative(outputDir, localPath),
            type: 'dataspace-asset',
            dataspace: dataspaceName,
            size: result.size,
            contentType: result.contentType,
            skipped: result.skipped,
            timestamp: new Date().toISOString(),
          });
          
          if (result.skipped) {
            log(`    ${colors.dim}↷ ${getFilenameFromUrl(fileUrl)} (exists)${colors.reset}`);
          } else {
            logSuccess(`    ${getFilenameFromUrl(fileUrl)}`);
          }
        } catch (error) {
          logError(`    ${getFilenameFromUrl(fileUrl)}: ${error.message}`);
        }
      }
      
      if (files.length === 0) {
        logInfo('    No assets found in this dataspace');
      }
    }
  } catch (error) {
    logError(`Failed to sync dataspaces: ${error.message}`);
  }
  
  return results;
}

/**
 * Generate manifest.json with all retrieved files
 */
function generateManifest(assets, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    podUrl: CONFIG.podUrl,
    totalFiles: assets.length,
    downloaded: assets.filter(a => !a.skipped).length,
    skipped: assets.filter(a => a.skipped).length,
    files: assets.map(asset => ({
      originalUrl: asset.url,
      localPath: asset.localPath,
      type: asset.type,
      dataspace: asset.dataspace || null,
      contentType: asset.contentType || 'unknown',
      size: asset.size || null,
      timestamp: asset.timestamp,
    })),
  };
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SYNC FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function syncAssets(options = {}) {
  const { force = false, dataspace = null } = options;
  
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          SOLID POD ASSET SYNC - LOCAL RETRIEVAL              ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');
  
  log(`📡 Pod URL: ${CONFIG.podUrl}`, 'blue');
  log(`📁 Output:  ${CONFIG.outputDir}`, 'blue');
  if (force) log(`🔄 Mode:    Force re-download`, 'yellow');
  if (dataspace) log(`🎯 Filter:  Dataspace "${dataspace}" only`, 'yellow');
  console.log('\n');
  
  // Ensure output directory
  ensureDirectoryExists(CONFIG.outputDir);
  
  const allAssets = [];
  
  // Sync DPP files
  log('─'.repeat(60), 'dim');
  const dppFiles = await syncDPPFiles(CONFIG.podUrl, CONFIG.outputDir, force);
  allAssets.push(...dppFiles);
  
  // Sync Dataspace files
  console.log('');
  log('─'.repeat(60), 'dim');
  const dataspaceFiles = await syncDataspaceFiles(CONFIG.podUrl, CONFIG.outputDir, force, dataspace);
  allAssets.push(...dataspaceFiles);
  
  // Generate manifest
  console.log('\n');
  log('─'.repeat(60), 'dim');
  logStep('MANIFEST', 'Generating manifest.json');
  const manifestPath = generateManifest(allAssets, CONFIG.outputDir);
  logSuccess(`Manifest saved: ${path.relative(__dirname, manifestPath)}`);
  
  // Summary
  const downloaded = allAssets.filter(a => !a.skipped).length;
  const skipped = allAssets.filter(a => a.skipped).length;
  
  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'green');
  log('                      SYNC COMPLETE!                            ', 'green');
  log('═══════════════════════════════════════════════════════════════', 'green');
  console.log('');
  log(`  📊 Total files:    ${allAssets.length}`, 'cyan');
  log(`  ⬇️  Downloaded:     ${downloaded}`, 'green');
  log(`  ↷  Skipped:        ${skipped} (use --force to re-download)`, 'dim');
  log(`  📁 Location:       ${CONFIG.outputDir}`, 'cyan');
  console.log('\n');
  
  return allAssets;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════════════════

function parseArgs(args) {
  const options = {
    command: null,
    force: false,
    dataspace: null,
    help: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--dataspace' || arg === '-d') {
      options.dataspace = args[++i];
    } else if (arg === '-retrieve' || arg === 'retrieve') {
      options.command = 'retrieve';
    } else if (arg === 'last-assets') {
      // Part of retrieve command
    }
  }
  
  // Default command
  if (!options.command && !options.help && args.length === 0) {
    options.command = 'retrieve';
  }
  
  return options;
}

function showHelp() {
  console.log(`
${colors.bold}Solid Pod Asset Sync - Local Retrieval${colors.reset}

${colors.cyan}Description:${colors.reset}
  Retrieves uploaded files from your Solid Pod and saves them locally
  to ./DATA/ folder, mirroring the remote structure.

${colors.cyan}Usage:${colors.reset}
  node retrieve-assets.js -retrieve last-assets [options]
  node retrieve-assets.js [options]

${colors.cyan}Options:${colors.reset}
  -retrieve last-assets    Sync all assets from Pod to local DATA folder
  --dataspace <id>, -d     Sync only a specific dataspace
  --force, -f              Force re-download (overwrite existing files)
  --help, -h               Show this help message

${colors.cyan}Examples:${colors.reset}
  node retrieve-assets.js -retrieve last-assets
  node retrieve-assets.js -retrieve last-assets --force
  node retrieve-assets.js -retrieve last-assets --dataspace myproject
  node retrieve-assets.js --dataspace testdata -f

${colors.cyan}Environment Variables:${colors.reset}
  SOLID_POD_URL    Your Solid Pod URL 
                   (default: ${CONFIG.podUrl})

${colors.cyan}Output Structure:${colors.reset}
  DATA/
  ├── dpp/                      ← DPP files from {podUrl}/dpp/
  ├── dataspaces/
  │   ├── {dataSpaceId}/
  │   │   └── data/             ← Assets from {podUrl}/dataspaces/{id}/data/
  │   └── ...
  └── manifest.json             ← Metadata for all retrieved files

${colors.cyan}Manifest Format:${colors.reset}
  {
    "generatedAt": "2024-01-01T12:00:00.000Z",
    "podUrl": "https://...",
    "totalFiles": 5,
    "files": [
      {
        "originalUrl": "https://pod/dpp/file.json",
        "localPath": "dpp/file.json",
        "type": "dpp",
        "contentType": "application/json",
        "timestamp": "..."
      }
    ]
  }
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const options = parseArgs(args);

if (options.help) {
  showHelp();
  process.exit(0);
}

if (options.command === 'retrieve' || args.length === 0 || args.join(' ').includes('retrieve')) {
  syncAssets({
    force: options.force,
    dataspace: options.dataspace,
  }).catch((error) => {
    logError(`Sync failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  });
} else {
  log(`Unknown command. Use --help for usage information.`, 'red');
  process.exit(1);
}
