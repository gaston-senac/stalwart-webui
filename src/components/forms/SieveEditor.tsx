/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import CodeMirror from '@uiw/react-codemirror';

import { sieveExtensions } from './sieveLanguage';

interface SieveEditorProps {
  value: string;
  onCommit: (v: string) => void;
  readOnly?: boolean;
  className?: string;
}

const extensions = sieveExtensions();

// Commits on every keystroke rather than buffering to blur like the plain
// textareas elsewhere in this file: CodeMirror manages focus on its own
// internal contenteditable, so a parent "Save" click can fire before a blur
// commit lands, saving stale content. This form only has a handful of fields,
// so re-rendering on each keystroke here is not a real cost.
export default function SieveEditor({ value, onCommit, readOnly, className }: SieveEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={(v) => onCommit(v)}
      extensions={extensions}
      theme="none"
      readOnly={readOnly}
      minHeight="10rem"
      maxHeight="28rem"
      className={className}
    />
  );
}
