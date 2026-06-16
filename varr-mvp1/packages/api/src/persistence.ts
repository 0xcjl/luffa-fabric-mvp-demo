import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  createEmptySnapshot,
  createMemoryRepositories,
  snapshotRepositories
} from "../../core/src/storage/memory.repository.ts";
import type { LaelRepositories, RepositorySnapshot } from "../../core/src/storage/repository.interface.ts";

export type SnapshotRepositories = {
  repositories: LaelRepositories;
  persistSnapshot: () => Promise<void>;
};

export async function createSnapshotRepositories(stateFile: string): Promise<SnapshotRepositories> {
  const repositories = createMemoryRepositories(await loadSnapshotFile(stateFile));
  return {
    repositories,
    persistSnapshot: () => saveSnapshotFile(stateFile, repositories)
  };
}

export async function loadSnapshotFile(stateFile: string): Promise<RepositorySnapshot> {
  try {
    const parsed = JSON.parse(await readFile(stateFile, "utf8")) as Partial<RepositorySnapshot>;
    return { ...createEmptySnapshot(), ...parsed };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return createEmptySnapshot();
    }
    throw error;
  }
}

export async function saveSnapshotFile(stateFile: string, repositories: LaelRepositories): Promise<void> {
  await mkdir(dirname(stateFile), { recursive: true });
  await writeFile(stateFile, `${JSON.stringify(await snapshotRepositories(repositories), null, 2)}\n`);
}
