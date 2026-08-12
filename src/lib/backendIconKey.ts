/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

/** Normalize a schema `@type` / variant name for BackendIcon lookups. */
export function normalizeBackendKey(backend: string): string {
  return backend.toLowerCase().replace(/[^a-z0-9]/g, '');
}
