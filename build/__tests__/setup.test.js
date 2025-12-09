/**
 * Setup verification test
 */
import { describe, it, expect } from 'vitest';
import { isAuthenticated, defaultTestContext } from './utils.js';
describe('Test Setup', () => {
    it('should have test utilities available', () => {
        expect(typeof isAuthenticated).toBe('function');
        expect(defaultTestContext.testTrackId).toBeDefined();
        expect(defaultTestContext.testArtistId).toBeDefined();
    });
    it('should check authentication status', () => {
        const authStatus = isAuthenticated();
        expect(typeof authStatus).toBe('boolean');
        console.log(`Authentication status: ${authStatus ? 'Authenticated' : 'Not authenticated'}`);
    });
});
