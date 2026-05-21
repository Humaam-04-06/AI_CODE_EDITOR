// Metadata for the 8 VS Code inspired premium themes
export const THEMES = [
  { id: 'dark-plus', name: 'Dark+ (Default)', class: 'theme-dark-plus', bg: '#1E1E1E', accent: '#569CD6', basedOn: 'VS Code' },
  { id: 'one-dark-pro', name: 'One Dark Pro', class: 'theme-one-dark-pro', bg: '#282C34', accent: '#E06C75', basedOn: 'Atom' },
  { id: 'dracula', name: 'Dracula', class: 'theme-dracula', bg: '#282A36', accent: '#BD93F9', basedOn: 'Official Dracula' },
  { id: 'monokai', name: 'Monokai', class: 'theme-monokai', bg: '#272822', accent: '#A6E22E', basedOn: 'Retro Monokai' },
  { id: 'catppuccin', name: 'Catppuccin Mocha', class: 'theme-catppuccin', bg: '#1E1E2E', accent: '#CBA6F7', basedOn: 'Catppuccin' },
  { id: 'nord', name: 'Nord', class: 'theme-nord', bg: '#2E3440', accent: '#88C0D0', basedOn: 'Arctic Ice' },
  { id: 'solarized-dark', name: 'Solarized Dark', class: 'theme-solarized-dark', bg: '#002B36', accent: '#268BD2', basedOn: 'Solarized' },
  { id: 'github-dark', name: 'GitHub Dark', class: 'theme-github-dark', bg: '#0D1117', accent: '#58A6FF', basedOn: 'GitHub UI' }
];

// Monaco specific color mapping configurations
export const MONACO_THEMES = {
  'one-dark-pro': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C678DD' },
      { token: 'string', foreground: '98C379' },
      { token: 'number', foreground: 'D19A66' },
      { token: 'regexp', foreground: '56B6C2' },
      { token: 'type', foreground: 'E5C07B' },
      { token: 'class', foreground: 'E5C07B' },
      { token: 'function', foreground: '61AFEF' },
      { token: 'variable', foreground: 'ABB2BF' }
    ],
    colors: {
      'editor.background': '#282C34',
      'editor.foreground': '#ABB2BF',
      'editor.lineHighlightBackground': '#2C313C',
      'editorCursor.foreground': '#528BFF',
      'editor.selectionBackground': '#3E4451',
      'editorLineNumber.foreground': '#4B5263'
    }
  },
  'dracula': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF79C6' },
      { token: 'string', foreground: 'F1FA8C' },
      { token: 'number', foreground: 'BD93F9' },
      { token: 'regexp', foreground: '8BE9FD' },
      { token: 'type', foreground: '8BE9FD', fontStyle: 'italic' },
      { token: 'class', foreground: '50FA7B' },
      { token: 'function', foreground: '50FA7B' },
      { token: 'variable', foreground: 'F8F8F2' }
    ],
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#343746',
      'editorCursor.foreground': '#F8F8F0',
      'editor.selectionBackground': '#44475A',
      'editorLineNumber.foreground': '#6272A4'
    }
  },
  'monokai': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'regexp', foreground: 'AE81FF' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      { token: 'class', foreground: 'A6E22E' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' }
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#3E3D32',
      'editorCursor.foreground': '#F8F8F0',
      'editor.selectionBackground': '#49483E',
      'editorLineNumber.foreground': '#90908A'
    }
  },
  'catppuccin': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6C7086', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'CBA6F7' },
      { token: 'string', foreground: 'A6E3A1' },
      { token: 'number', foreground: 'FAB387' },
      { token: 'regexp', foreground: 'F5C2E7' },
      { token: 'type', foreground: 'F9E2AF' },
      { token: 'class', foreground: 'F9E2AF' },
      { token: 'function', foreground: '89B4FA' },
      { token: 'variable', foreground: 'CDD6F4' }
    ],
    colors: {
      'editor.background': '#1E1E2E',
      'editor.foreground': '#CDD6F4',
      'editor.lineHighlightBackground': '#2D2D44',
      'editorCursor.foreground': '#F5E0DC',
      'editor.selectionBackground': '#313244',
      'editorLineNumber.foreground': '#585B70'
    }
  },
  'nord': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4C566A', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81A1C1' },
      { token: 'string', foreground: 'A3BE8C' },
      { token: 'number', foreground: 'B48EAD' },
      { token: 'regexp', foreground: 'EBCB8B' },
      { token: 'type', foreground: '8FBCBB' },
      { token: 'class', foreground: '8FBCBB' },
      { token: 'function', foreground: '88C0D0' },
      { token: 'variable', foreground: 'D8DEE9' }
    ],
    colors: {
      'editor.background': '#2E3440',
      'editor.foreground': '#D8DEE9',
      'editor.lineHighlightBackground': '#3B4252',
      'editorCursor.foreground': '#D8DEE9',
      'editor.selectionBackground': '#434C5E',
      'editorLineNumber.foreground': '#4C566A'
    }
  },
  'solarized-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586E75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2AA198' },
      { token: 'number', foreground: 'D33682' },
      { token: 'regexp', foreground: '2AA198' },
      { token: 'type', foreground: 'B58900' },
      { token: 'class', foreground: 'CB4B16' },
      { token: 'function', foreground: '268BD2' },
      { token: 'variable', foreground: '839496' }
    ],
    colors: {
      'editor.background': '#002B36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#073642',
      'editorCursor.foreground': '#839496',
      'editor.selectionBackground': '#073642',
      'editorLineNumber.foreground': '#586E75'
    }
  },
  'github-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'regexp', foreground: '79C0FF' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'class', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'variable', foreground: 'C9D1D9' }
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#C9D1D9',
      'editor.lineHighlightBackground': '#161B22',
      'editorCursor.foreground': '#58A6FF',
      'editor.selectionBackground': '#21262D',
      'editorLineNumber.foreground': '#484F58'
    }
  }
};
