/**
 * Tests for spotifyInfo tool
 * Requirements: 1.1-1.7
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { herramientasInfo } from '../tools/info.js';
import { requireAuth, getResponseText, assertNoError, assertContainsId, createMockContext, delay, } from './utils.js';
const spotifyInfo = herramientasInfo[0];
const context = createMockContext();
describe('spotifyInfo', () => {
    beforeAll(() => {
        requireAuth();
    });
    /**
     * Test 2.1: Profile action
     * Requirements: 1.4
     */
    describe('profile action', () => {
        it('should return user profile with name, email, and country', async () => {
            const response = (await spotifyInfo.ejecutar({ accion: 'profile' }, context));
            assertNoError(response);
            const text = getResponseText(response);
            // Verify response contains required fields
            expect(text).toContain('Nombre');
            expect(text).toContain('Email');
            expect(text).toContain('País');
            expect(text).toContain('Perfil');
        });
    });
    /**
     * Test 2.2: Search action
     * Requirements: 1.1
     */
    describe('search action', () => {
        it('should return search results with IDs for artist search', async () => {
            await delay(500); // Avoid rate limiting
            const response = (await spotifyInfo.ejecutar({ accion: 'search', consulta: 'Queen', tipo: 'artist' }, context));
            assertNoError(response);
            assertContainsId(response);
            const text = getResponseText(response);
            expect(text).toContain('Resultados');
            expect(text).toContain('Queen');
        });
        it('should return search results with IDs for track search', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'search', consulta: 'Bohemian Rhapsody', tipo: 'track' }, context));
            assertNoError(response);
            assertContainsId(response);
            const text = getResponseText(response);
            expect(text).toContain('Resultados');
        });
    });
    /**
     * Test 2.3: Devices action
     * Requirements: 1.3
     */
    describe('devices action', () => {
        it('should return devices list or no devices message', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'devices' }, context));
            const text = getResponseText(response);
            // Either shows devices or "no devices" message
            const hasDevices = text.includes('Dispositivos');
            const noDevices = text.includes('Sin dispositivos');
            expect(hasDevices || noDevices).toBe(true);
            // If devices exist, should have ID format
            if (hasDevices) {
                expect(text).toMatch(/ID:/);
            }
        });
    });
    /**
     * Test 2.4: Playlists action
     * Requirements: 1.5
     */
    describe('playlists action', () => {
        it('should return user playlists with names and IDs', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'playlists', limite: 10 }, context));
            const text = getResponseText(response);
            // Either has playlists or empty message
            const hasPlaylists = text.includes('Playlists');
            const noPlaylists = text.includes('Sin playlists');
            expect(hasPlaylists || noPlaylists).toBe(true);
            // If playlists exist, should have IDs
            if (hasPlaylists) {
                assertContainsId(response);
            }
        });
    });
    /**
     * Test 2.5: topTracks and topArtists actions
     * Requirements: 1.6, 1.7
     */
    describe('topTracks action', () => {
        it('should return top tracks for short_term period', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'topTracks', periodo: 'short_term', limite: 5 }, context));
            const text = getResponseText(response);
            // Either has data or empty message
            const hasData = text.includes('Top Canciones');
            const noData = text.includes('Sin datos');
            expect(hasData || noData).toBe(true);
            if (hasData) {
                expect(text).toContain('4 semanas');
                assertContainsId(response);
            }
        });
        it('should return top tracks for medium_term period', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'topTracks', periodo: 'medium_term', limite: 5 }, context));
            const text = getResponseText(response);
            const hasData = text.includes('Top Canciones');
            const noData = text.includes('Sin datos');
            expect(hasData || noData).toBe(true);
            if (hasData) {
                expect(text).toContain('6 meses');
            }
        });
    });
    describe('topArtists action', () => {
        it('should return top artists for short_term period', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'topArtists', periodo: 'short_term', limite: 5 }, context));
            const text = getResponseText(response);
            const hasData = text.includes('Top Artistas');
            const noData = text.includes('Sin datos');
            expect(hasData || noData).toBe(true);
            if (hasData) {
                expect(text).toContain('4 semanas');
                assertContainsId(response);
            }
        });
        it('should return top artists for long_term period', async () => {
            await delay(500);
            const response = (await spotifyInfo.ejecutar({ accion: 'topArtists', periodo: 'long_term', limite: 5 }, context));
            const text = getResponseText(response);
            const hasData = text.includes('Top Artistas');
            const noData = text.includes('Sin datos');
            expect(hasData || noData).toBe(true);
            if (hasData) {
                expect(text).toContain('siempre');
            }
        });
    });
});
