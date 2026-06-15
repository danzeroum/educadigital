/**
 * IndexedDB schema para modo offline.
 * Usa idb (typed wrapper sobre IndexedDB).
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface EducaDigitalDB extends DBSchema {
  resources: {
    key: string;
    value: {
      id: string;
      title: string;
      mediaType: string;
      cdnUrl: string | null;
      thumbnailUrl: string | null;
      ejaLevel: string | null;
      summaryBasic: string | null;
      cachedAt: Date;
    };
    indexes: { "by-eja-level": string };
  };
  progress: {
    key: string; // `${userId}:${resourceId}`
    value: {
      userId: string;
      resourceId: string;
      completionPct: number;
      lastPositionSeconds: number | null;
      synced: boolean;
      updatedAt: Date;
    };
  };
  exerciseQueue: {
    key: string; // uuid
    value: {
      id: string;
      userId: string;
      exerciseId: string;
      response: unknown;
      isCorrect: boolean;
      respondedAt: Date;
      synced: boolean;
    };
  };
  srsCards: {
    key: string;
    value: {
      id: string;
      conceptLabel: string;
      dueDate: Date;
      intervalDays: number;
      easeFactor: number;
      repetitions: number;
      resourceId: string | null;
    };
    indexes: { "by-due-date": Date };
  };
  tutorQueue: {
    key: string;
    value: {
      id: string;
      conversationId: string;
      message: string;
      sentAt: Date;
      synced: boolean;
    };
  };
}

let _db: IDBPDatabase<EducaDigitalDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<EducaDigitalDB>> {
  if (_db) return _db;

  _db = await openDB<EducaDigitalDB>("educadigital", 1, {
    upgrade(db) {
      const resourceStore = db.createObjectStore("resources", { keyPath: "id" });
      resourceStore.createIndex("by-eja-level", "ejaLevel");

      db.createObjectStore("progress", { keyPath: "id" });
      db.createObjectStore("exerciseQueue", { keyPath: "id" });

      const srsStore = db.createObjectStore("srsCards", { keyPath: "id" });
      srsStore.createIndex("by-due-date", "dueDate");

      db.createObjectStore("tutorQueue", { keyPath: "id" });
    },
  });

  return _db;
}

export async function saveResourceOffline(resource: EducaDigitalDB["resources"]["value"]) {
  const db = await getDB();
  await db.put("resources", resource);
}

export async function getOfflineResources(ejaLevel?: string) {
  const db = await getDB();
  if (ejaLevel) {
    return db.getAllFromIndex("resources", "by-eja-level", ejaLevel);
  }
  return db.getAll("resources");
}

export async function queueExerciseResponse(response: EducaDigitalDB["exerciseQueue"]["value"]) {
  const db = await getDB();
  await db.put("exerciseQueue", response);
}

export async function getPendingSyncItems() {
  const db = await getDB();
  const [progress, exercises, tutor] = await Promise.all([
    db.getAll("progress"),
    db.getAll("exerciseQueue"),
    db.getAll("tutorQueue"),
  ]);

  return {
    progress: progress.filter((p) => !p.synced),
    exercises: exercises.filter((e) => !e.synced),
    tutor: tutor.filter((t) => !t.synced),
  };
}
