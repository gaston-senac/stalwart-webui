/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { BackendIcon } from './BackendIcon';

describe('BackendIcon', () => {
  beforeEach(() => {
    let baseEl = document.querySelector('base');
    if (!baseEl) {
      baseEl = document.createElement('base');
      document.head.appendChild(baseEl);
    }
    baseEl.setAttribute('href', 'https://mail.example.com/admin/');
  });

  it('prefixes brand assets with the document base (prod /admin mount)', () => {
    const html = renderToStaticMarkup(createElement(BackendIcon, { backend: 'S3' }));
    expect(html).toContain('https://mail.example.com/admin/icons/backends/aws-light.svg');
  });

  it('renders a Lucide stand-in for FileSystem', () => {
    const html = renderToStaticMarkup(createElement(BackendIcon, { backend: 'FileSystem' }));
    expect(html).toContain('<svg');
    expect(html).not.toContain('src=');
  });
});
