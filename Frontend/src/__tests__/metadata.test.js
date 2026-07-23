import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Metadata and constants definition tests
const REQUIRED_GESTURE_KEYS = ['name', 'action'];

const SAMPLE_BUILTIN_GESTURES = [
  { emoji: '☝️', name: 'Index Finger Up', action: 'Move Cursor', desc: 'Only index extended, hand moves freely' },
  { emoji: '🤏', name: 'Quick Pinch', action: 'Left Click', desc: 'Index + thumb briefly touch and release' },
  { emoji: '🤏🤏', name: 'Double Pinch', action: 'Double Click', desc: 'Two rapid pinches within 0.35 s' },
  { emoji: '✊', name: 'Closed Fist (still)', action: 'Minimize Window', desc: 'All fingers curled, no movement for 0.5s' },
  { emoji: '✋', name: 'Open Palm', action: 'Freeze / Rest Mode', desc: 'All five fingers extended, hand still' }
];

const AVAILABLE_ACTIONS = [
  'Left Click', 'Right Click', 'Double Click', 'Middle Click',
  'Scroll Up', 'Scroll Down', 'Zoom In', 'Zoom Out',
  'Navigate Back', 'Navigate Forward',
  'Switch Window (Alt+Tab)', 'Minimize Window', 'Close Window (Alt+F4)',
  'Open Start Menu', 'Freeze / Rest Mode',
  'Toggle Voice Mode', 'Lock Screen', 'Screenshot', 'Show Desktop'
];

describe('Frontend Metadata Integrity Tests', () => {
  it('should validate builtin gestures structure', () => {
    assert.strictEqual(Array.isArray(SAMPLE_BUILTIN_GESTURES), true);
    assert.ok(SAMPLE_BUILTIN_GESTURES.length > 0);

    for (const gesture of SAMPLE_BUILTIN_GESTURES) {
      for (const key of REQUIRED_GESTURE_KEYS) {
        assert.ok(key in gesture, `Missing key ${key} in gesture ${gesture.name}`);
        assert.strictEqual(typeof gesture[key], 'string');
      }
    }
  });

  it('should validate unique gesture names', () => {
    const names = SAMPLE_BUILTIN_GESTURES.map(g => g.name);
    const uniqueNames = new Set(names);
    assert.strictEqual(names.length, uniqueNames.size);
  });

  it('should validate available actions list', () => {
    assert.strictEqual(Array.isArray(AVAILABLE_ACTIONS), true);
    assert.ok(AVAILABLE_ACTIONS.includes('Left Click'));
    assert.ok(AVAILABLE_ACTIONS.includes('Right Click'));
    assert.ok(AVAILABLE_ACTIONS.includes('Minimize Window'));
  });
});
