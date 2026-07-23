import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:8000';

function buildEndpoint(path) {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

function parseSettings(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return {
      camera_index: Number(data.camera_index ?? 0),
      cursor_smoothing: Number(data.cursor_smoothing ?? 5),
      click_threshold_px: Number(data.click_threshold_px ?? 30),
      cooldown_period_sec: Number(data.cooldown_period_sec ?? 0.3),
      voice_commands_enabled: Boolean(data.voice_commands_enabled ?? true)
    };
  } catch {
    return null;
  }
}

describe('Frontend API & Utilities Tests', () => {
  it('should generate correct endpoint URLs', () => {
    assert.strictEqual(buildEndpoint('/settings'), 'http://localhost:8000/settings');
    assert.strictEqual(buildEndpoint('gestures'), 'http://localhost:8000/gestures');
    assert.strictEqual(buildEndpoint('/api/system-status'), 'http://localhost:8000/api/system-status');
  });

  it('should parse and sanitize settings JSON response', () => {
    const rawJson = JSON.stringify({
      camera_index: "1",
      cursor_smoothing: 8,
      click_threshold_px: 25,
      cooldown_period_sec: 0.5,
      voice_commands_enabled: true
    });

    const parsed = parseSettings(rawJson);
    assert.notStrictEqual(parsed, null);
    assert.strictEqual(parsed.camera_index, 1);
    assert.strictEqual(parsed.cursor_smoothing, 8);
    assert.strictEqual(parsed.click_threshold_px, 25);
    assert.strictEqual(parsed.voice_commands_enabled, true);
  });

  it('should return null when parsing invalid JSON', () => {
    const parsed = parseSettings("INVALID_JSON_RESPONSE");
    assert.strictEqual(parsed, null);
  });
});
