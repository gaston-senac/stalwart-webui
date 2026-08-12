/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { create } from 'zustand';

export interface ObjectListEntry {
  id: string;
  label: string;
}

interface CacheState {
  displayNames: Record<string, Record<string, string>>;

  objectLists: Record<string, ObjectListEntry[]>;

  setDisplayNames: (objectType: string, entries: Record<string, string>) => void;
  getDisplayName: (objectType: string, id: string) => string | undefined;
  invalidateCache: (objectType: string) => void;

  setObjectList: (key: string, entries: ObjectListEntry[]) => void;
  getObjectList: (key: string) => ObjectListEntry[] | undefined;
  invalidateObjectList: (key: string) => void;
  /**
   * Drop combobox caches and display names for an object type and its views
   * (`x:Account` → also `x:Account/User`, `x:Account/Group`). Prefer this over
   * wiping every list on navigation.
   */
  invalidateRelatedObjectCache: (objectName: string) => void;
  invalidateAllObjectLists: () => void;
  clearAll: () => void;
}

export const useCacheStore = create<CacheState>()((set, get) => ({
  displayNames: {},
  objectLists: {},

  setDisplayNames: (objectType, entries) => {
    set((state) => ({
      displayNames: {
        ...state.displayNames,
        [objectType]: {
          ...state.displayNames[objectType],
          ...entries,
        },
      },
    }));
  },

  getDisplayName: (objectType, id) => {
    return get().displayNames[objectType]?.[id];
  },

  invalidateCache: (objectType) => {
    set((state) => {
      const { [objectType]: _removed, ...rest } = state.displayNames;
      void _removed;
      return { displayNames: rest };
    });
  },

  setObjectList: (key, entries) => {
    set((state) => ({
      objectLists: { ...state.objectLists, [key]: entries },
    }));
  },

  getObjectList: (key) => {
    return get().objectLists[key];
  },

  invalidateObjectList: (key) => {
    set((state) => {
      const { [key]: _removed, ...rest } = state.objectLists;
      void _removed;
      return { objectLists: rest };
    });
  },

  invalidateRelatedObjectCache: (objectName) => {
    set((state) => {
      const objectLists = { ...state.objectLists };
      for (const key of Object.keys(objectLists)) {
        if (key === objectName || key.startsWith(`${objectName}/`)) {
          delete objectLists[key];
        }
      }
      const { [objectName]: _removed, ...displayNames } = state.displayNames;
      void _removed;
      return { objectLists, displayNames };
    });
  },

  invalidateAllObjectLists: () => {
    set({ objectLists: {} });
  },

  // Switching the active JMAP account can make cached objectId display
  // names and lists resolve against the wrong account's data.
  clearAll: () => {
    set({ displayNames: {}, objectLists: {} });
  },
}));
