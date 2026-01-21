# Assets Folder

This folder contains assets retrieved from your Solid Pod dataspaces.

## Structure

- `/examples/` - Example assets (placeholders)
- `manifest.json` - List of all retrieved assets

## Usage

Run `node retrieve-assets.js` from the project root to sync assets from your Pod.

## Configuration

Edit the CONFIG object in `retrieve-assets.js` to update:
- `podUrl` - Your Solid Pod URL
- `outputDir` - Where to save assets
- `dataspaceContainer` - Path to dataspaces in your Pod

Generated: 2026-01-21T08:32:00.696Z
