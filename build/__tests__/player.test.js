/**
 * Tests for spotifyPlayer tool
 * Requirements: 2.1-2.7
 *
 * Note: These tests require an active Spotify device.
 * If no device is active, tests will pass with a warning.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { herramientasPlayer } from '../tools/player.js';
import { requireAuth, getResponseText, createMockContext, delay, defaultTestContext, } from './utils.js';
const spotifyPlayer = herramientasPlayer[0];
const context = createMockContext();
/**
 * Check if error is due to no active device
 */
function isNoActiveDeviceError(error) {
    if (error instanceof Error) {
        return error.message.includes('NO_ACTIVE_DEVICE') ||
            error.message.includes('No active device');
    }
    return false;
}
/**
 * Helper to handle player actions that may fail due to no active device
 */
async function executePlayerAction(action) {
    try {
        const response = (await spotifyPlayer.ejecutar(action, context));
        return { response, skipped: false };
    }
    catch (error) {
        if (isNoActiveDeviceError(error)) {
            console.log('⏭️ Skipped: No active Spotify device');
            return { response: null, skipped: true };
        }
        throw error;
    }
}
describe('spotifyPlayer', () => {
    beforeAll(() => {
        requireAuth();
    });
    /**
     * Test 4.1: Play action with track ID
     * Requirements: 2.1
     */
    describe('play action', () => {
        it('should play a track by ID and return confirmation message', async () => {
            const { response, skipped } = await executePlayerAction({
                accion: 'play',
                tipo: 'track',
                id: defaultTestContext.testTrackId,
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('▶️');
            expect(text).toMatch(/Reproduciendo|álbum/);
        });
    });
    /**
     * Test 4.2: Pause and resume actions
     * Requirements: 2.2, 2.3
     */
    describe('pause and resume actions', () => {
        it('should pause playback and return confirmation message', async () => {
            await delay(1000);
            const { response, skipped } = await executePlayerAction({
                accion: 'pause',
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('⏸️');
            expect(text).toContain('Pausado');
        });
        it('should resume playback and return confirmation message', async () => {
            await delay(500);
            const { response, skipped } = await executePlayerAction({
                accion: 'resume',
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('▶️');
            expect(text).toContain('Reanudado');
        });
    });
    /**
     * Test 4.3: Next and prev actions
     * Requirements: 2.4, 2.5
     */
    describe('next and prev actions', () => {
        it('should skip to next track and return confirmation message', async () => {
            await delay(500);
            const { response, skipped } = await executePlayerAction({
                accion: 'next',
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('⏭️');
            expect(text).toContain('Siguiente');
        });
        it('should skip to previous track and return confirmation message', async () => {
            await delay(500);
            const { response, skipped } = await executePlayerAction({
                accion: 'prev',
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('⏮️');
            expect(text).toContain('Anterior');
        });
    });
    /**
     * Test 4.4: Volume action
     * Requirements: 2.6
     */
    describe('volume action', () => {
        it('should set volume and return confirmation with value', async () => {
            await delay(500);
            const volumeValue = 50;
            const { response, skipped } = await executePlayerAction({
                accion: 'volume',
                valor: volumeValue,
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('🔊');
            expect(text).toContain('Volumen');
            expect(text).toContain(`${volumeValue}%`);
        });
    });
    /**
     * Test 4.5: Shuffle action
     * Requirements: 2.7
     */
    describe('shuffle action', () => {
        it('should enable shuffle and return confirmation message', async () => {
            await delay(500);
            const { response, skipped } = await executePlayerAction({
                accion: 'shuffle',
                valor: true,
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('🔀');
            expect(text).toContain('Aleatorio');
            expect(text).toContain('activado');
        });
        it('should disable shuffle and return confirmation message', async () => {
            await delay(500);
            const { response, skipped } = await executePlayerAction({
                accion: 'shuffle',
                valor: false,
            });
            if (skipped)
                return;
            const text = getResponseText(response);
            expect(text).not.toMatch(/Error|❌/);
            expect(text).toContain('🔀');
            expect(text).toContain('Aleatorio');
            expect(text).toContain('desactivado');
        });
    });
});
