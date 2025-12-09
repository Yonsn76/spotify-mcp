/**
 * Vitest setup file - loads environment variables for tests
 */
import fs from 'node:fs';
import path from 'node:path';
// Load environment variables from mcp.json
function loadEnvFromMcpJson() {
    const mcpJsonPath = path.join(process.cwd(), '.kiro/settings/mcp.json');
    try {
        if (fs.existsSync(mcpJsonPath)) {
            const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
            const spotifyEnv = mcpConfig?.mcpServers?.spotify?.env;
            if (spotifyEnv) {
                for (const [key, value] of Object.entries(spotifyEnv)) {
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
                console.log('✓ Loaded Spotify credentials from mcp.json');
            }
        }
    }
    catch (error) {
        console.warn('Warning: Could not load mcp.json:', error);
    }
}
loadEnvFromMcpJson();
