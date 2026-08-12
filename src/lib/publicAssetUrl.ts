/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

/**
 * Resolve a file under `public/` so it respects Stalwart's rewritten
 * `<base href="/admin/">` (or `/account/`, custom prefixes).
 *
 * Absolute paths like `/icons/...` ignore `<base>` and 404 in production
 * when the WebUI is mounted under a prefix. Relative paths resolve against
 * `document.baseURI` instead.
 */
export function publicAssetUrl(relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+/, '');
  if (typeof document !== 'undefined' && document.baseURI) {
    return new URL(cleaned, document.baseURI).href;
  }
  const base = import.meta.env.BASE_URL || './';
  return new URL(cleaned, base).href;
}
