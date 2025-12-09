/**
 * Tests for spotifyLibrary tool
 * Requirements: 3.1-3.5
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { herramientasLibrary } from '../tools/library.js';
import { requireAuth, getResponseText, createMockContext, delay, defaultTestContext, } from './utils.js';
const spotifyLibrary = herramientasLibrary[0];
const context = createMockContext();
// Track ID for round-trip testing (different from default to avoid conflicts)
const testTrackForRoundTrip = '3n3Ppam7vgaVa1iaRUc9Lp'; // "Mr. Brightside" by The Killers
// Store created playlist ID for cleanup
let createdPlaylistId = null;
describe('spotifyLibrary', () => {
    beforeAll(() => {
        requireAuth();
    });
    // Cleanup: delete test playlist if created
    afterAll(async () => {
        // Note: Spotify API doesn't have a direct delete playlist endpoint
        // The playlist will remain but can be manually deleted
        if (createdPlaylistId) {
            console.log(`⚠️ Test playlist created with ID: ${createdPlaylistId}`);
            console.log('You may want to delete it manually from your Spotify account.');
        }
    });
    /**
     * Test 6.1: Check action
     * Requirements: 3.1
     */
    describe('check action', () => {
        it('should return saved status for track IDs', async () => {
            const response = (await spotifyLibrary.ejecutar({ accion: 'check', ids: [defaultTestContext.testTrackId] }, context));
            const text = getResponseText(response);
            // Should contain the track ID and status indicator
            expect(text).toContain('Estado');
            expect(text).toContain(defaultTestContext.testTrackId);
            // Should have either "Guardada" or "No guardada"
            expect(text).toMatch(/Guardada|No guardada/);
        });
        it('should handle multiple track IDs', async () => {
            await delay(500);
            const response = (await spotifyLibrary.ejecutar({ accion: 'check', ids: [defaultTestContext.testTrackId, testTrackForRoundTrip] }, context));
            const text = getResponseText(response);
            expect(text).toContain('Estado');
            expect(text).toContain(defaultTestContext.testTrackId);
            expect(text).toContain(testTrackForRoundTrip);
        });
        it('should return error when no IDs provided', async () => {
            await delay(500);
            const response = (await spotifyLibrary.ejecutar({ accion: 'check', ids: [] }, context));
            const text = getResponseText(response);
            expect(text).toContain('Error');
        });
    });
    /**
     * Test 6.2: Save and remove actions with round-trip verification
     * **Property 1: Save/Remove Round Trip**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    describe('save and remove actions (round-trip)', () => {
        it('should save a track, verify saved status, remove it, and verify not saved', async () => {
            await delay(500);
            // Step 1: Save the track
            const saveResponse = (await spotifyLibrary.ejecutar({ accion: 'save', ids: [testTrackForRoundTrip] }, context));
            const saveText = getResponseText(saveResponse);
            expect(saveText).toContain('guardada');
            expect(saveText).not.toContain('Error');
            await delay(500);
            // Step 2: Check that the track is saved
            const checkSavedResponse = (await spotifyLibrary.ejecutar({ accion: 'check', ids: [testTrackForRoundTrip] }, context));
            const checkSavedText = getResponseText(checkSavedResponse);
            expect(checkSavedText).toContain(testTrackForRoundTrip);
            expect(checkSavedText).toContain('✓ Guardada');
            await delay(500);
            // Step 3: Remove the track
            const removeResponse = (await spotifyLibrary.ejecutar({ accion: 'remove', ids: [testTrackForRoundTrip] }, context));
            const removeText = getResponseText(removeResponse);
            expect(removeText).toContain('eliminada');
            expect(removeText).not.toContain('Error');
            await delay(500);
            // Step 4: Check that the track is no longer saved
            const checkRemovedResponse = (await spotifyLibrary.ejecutar({ accion: 'check', ids: [testTrackForRoundTrip] }, context));
            const checkRemovedText = getResponseText(checkRemovedResponse);
            expect(checkRemovedText).toContain(testTrackForRoundTrip);
            expect(checkRemovedText).toContain('✗ No guardada');
        });
    });
    /**
     * Test 6.3: createPlaylist action
     * Requirements: 3.4
     */
    describe('createPlaylist action', () => {
        it('should create a playlist and return the ID', async () => {
            await delay(500);
            const playlistName = `Test Playlist ${Date.now()}`;
            const response = (await spotifyLibrary.ejecutar({
                accion: 'createPlaylist',
                nombre: playlistName,
                descripcion: 'Created by automated tests',
                publica: false
            }, context));
            const text = getResponseText(response);
            expect(text).toContain('Playlist');
            expect(text).toContain(playlistName);
            expect(text).toContain('creada');
            expect(text).toContain('ID:');
            // Extract and store playlist ID for subsequent tests
            const idMatch = text.match(/ID:\s*([a-zA-Z0-9]+)/);
            expect(idMatch).not.toBeNull();
            createdPlaylistId = idMatch[1];
        });
        it('should return error when no name provided', async () => {
            await delay(500);
            const response = (await spotifyLibrary.ejecutar({ accion: 'createPlaylist' }, context));
            const text = getResponseText(response);
            expect(text).toContain('Error');
        });
    });
    /**
     * Test 6.4: addToPlaylist action
     * Requirements: 3.5
     */
    describe('addToPlaylist action', () => {
        it('should add tracks to a playlist and return confirmation', async () => {
            await delay(500);
            // Skip if no playlist was created
            if (!createdPlaylistId) {
                console.log('⏭️ Skipped: No test playlist available');
                return;
            }
            const response = (await spotifyLibrary.ejecutar({
                accion: 'addToPlaylist',
                playlistId: createdPlaylistId,
                ids: [defaultTestContext.testTrackId]
            }, context));
            const text = getResponseText(response);
            expect(text).toContain('agregada');
            expect(text).not.toContain('Error');
        });
        it('should return error when no playlist ID provided', async () => {
            await delay(500);
            const response = (await spotifyLibrary.ejecutar({ accion: 'addToPlaylist', ids: [defaultTestContext.testTrackId] }, context));
            const text = getResponseText(response);
            expect(text).toContain('Error');
        });
        it('should return error when no track IDs provided', async () => {
            await delay(500);
            const response = (await spotifyLibrary.ejecutar({ accion: 'addToPlaylist', playlistId: 'somePlaylistId', ids: [] }, context));
            const text = getResponseText(response);
            expect(text).toContain('Error');
        });
    });
});
