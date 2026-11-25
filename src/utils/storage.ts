import type { GameSave } from '../types/game.ts';

const STORAGE_KEY = 'world_leader_saves_v1';

export function loadSaves(): GameSave[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as GameSave[]).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function upsertSave(save: GameSave): GameSave[] {
  const existing = loadSaves();
  const next = [save, ...existing.filter((s) => s.id !== save.id)].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Handle storage quota gracefully by trimming oldest turns if needed
  }
  return next;
}

export function deleteSave(id: string): GameSave[] {
  const existing = loadSaves();
  const next = existing.filter((s) => s.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
