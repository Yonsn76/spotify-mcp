/**
 * Test utilities for Spotify MCP Server tests
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const ARCHIVO_TOKENS = path.join(os.homedir(), '.spotify-mcp-tokens.json');
/**
 * Default test context with known Spotify IDs
 */
export const defaultTestContext = {
    // "Bohemian Rhapsody" by Queen - a well-known track
    testTrackId: '7tFiyTwD0nx5a1eklYtX2J',
    // Queen - a well-known artist
    testArtistId: '1dfeR4HaWDbWqFHLkxsg1d',
};
/**
 * Checks if the user is authenticated with Spotify
 * @returns true if tokens exist, false otherwise
 */
export function isAuthenticated() {
    try {
        if (fs.existsSync(ARCHIVO_TOKENS)) {
            const tokens = JSON.parse(fs.readFileSync(ARCHIVO_TOKENS, 'utf8'));
            return !!(tokens.accessToken && tokens.refreshToken);
        }
    }
    catch {
        // If there's an error reading tokens, assume not authenticated
    }
    return false;
}
/**
 * Skips test if not authenticated
 * @throws Error if not authenticated
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Run "npm run auth" first to authenticate with Spotify.');
    }
}
/**
 * Extracts text content from a tool response
 * @param response The tool response
 * @returns The text content or empty string
 */
export function getResponseText(response) {
    return response.content[0]?.text ?? '';
}
/**
 * Asserts that a response contains expected text
 * @param response The tool response
 * @param expected Text that should be present in the response
 */
export function assertResponseContains(response, expected) {
    const text = getResponseText(response);
    if (!text.includes(expected)) {
        throw new Error(`Expected response to contain "${expected}", but got: "${text}"`);
    }
}
/**
 * Asserts that a response does not contain error indicators
 * @param response The tool response
 */
export function assertNoError(response) {
    const text = getResponseText(response);
    if (text.startsWith('Error:') || text.includes('❌')) {
        throw new Error(`Unexpected error in response: "${text}"`);
    }
}
/**
 * Asserts that a response contains an ID pattern
 * @param response The tool response
 */
export function assertContainsId(response) {
    const text = getResponseText(response);
    // Spotify IDs are 22 characters alphanumeric
    const idPattern = /ID:\s*[a-zA-Z0-9]{22}/;
    if (!idPattern.test(text)) {
        throw new Error(`Expected response to contain a Spotify ID, but got: "${text}"`);
    }
}
/**
 * Creates a mock ContextoExtra for testing tools
 */
export function createMockContext() {
    return {
        signal: new AbortController().signal,
    };
}
/**
 * Delays execution for a specified time
 * Useful for avoiding rate limits between API calls
 * @param ms Milliseconds to wait
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
