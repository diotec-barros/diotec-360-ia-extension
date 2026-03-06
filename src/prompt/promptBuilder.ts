import { EditorContext } from './contextBuilder';

export type AngoCommand = 'generate' | 'explain' | 'refactor' | 'chat';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildMessages(command: AngoCommand, ctx: EditorContext, options?: { userInput?: string }): ChatMessage[] {
  const system =
    'You are ANGO IA, a helpful coding assistant integrated into VS Code.\n' +
    'Rules:\n' +
    '- Be concise, accurate, and practical.\n' +
    "- Do not claim you read files you were not shown. If you only have filenames/paths (open files list), treat it as a hint of project structure, not file contents.\n" +
    '- If information is missing, ask one targeted clarifying question instead of guessing.\n' +
    '- Prefer minimal, safe changes that match the existing style and conventions.';

  const user = buildUserContent(command, ctx, options);

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}

function buildUserContent(command: AngoCommand, ctx: EditorContext, options?: { userInput?: string }): string {
  const userInput = options?.userInput ?? '';

  const role =
    command === 'explain'
      ? 'Explain code and concepts clearly for a developer.'
      : command === 'refactor'
        ? 'Refactor code while preserving behavior.'
        : command === 'chat'
          ? 'Provide helpful answers and guidance based on the provided editor/project context.'
          : 'Generate code that fits the context and intent.';

  const task =
    command === 'explain'
      ? 'Explain the code/context. Be practical and specific to this project.'
      : command === 'refactor'
        ? 'Refactor the relevant code to improve readability, maintainability, and correctness.'
        : command === 'chat'
          ? 'Answer the user request using the provided context. Ask a clarifying question if needed.'
          : 'Generate code that satisfies the intent and integrates with the surrounding context.';

  const constraints =
    command === 'explain'
      ? [
          'Use clear sections and headings.',
          'Be concise but not vague.',
          'Call out risks, edge cases, and improvements.'
        ]
      : command === 'refactor'
        ? [
            'Preserve behavior unless a bug is obvious and the fix is low-risk.',
            'Minimize unnecessary changes.',
            'Output only the refactored code (no explanation).',
            'If multiple files are involved, state assumptions clearly and refactor only the code shown.'
          ]
        : command === 'chat'
          ? [
              'Be concise and actionable.',
              'Use Markdown when helpful.',
              'If context is insufficient, ask a single targeted question.',
              'Use the open files list to infer likely relationships (e.g., entrypoints, modules), but do not invent unseen code.'
            ]
          : [
              'Match existing style and conventions.',
              'Output only the code (no explanation).',
              'Use the open files list only to infer structure; do not reference code you have not been given.'
            ];

  const inputContext =
    command === 'chat'
      ? ['User request:', userInput.trim() || '(none)'].join('\n')
      : 'Use the editor selection and surrounding context to ground your response.';

  const output =
    command === 'explain'
      ? 'Return a Markdown explanation.'
      : command === 'refactor'
        ? 'Return only the refactored code.'
        : command === 'chat'
          ? 'Return a helpful answer in Markdown.'
          : 'Return only the generated code.';

  return [
    `Language: ${ctx.languageId}`,
    `Workspace: ${ctx.workspaceName || '(none)'}`,
    `File: ${ctx.relativePath || ctx.fileName}`,
    '',
    `Role: ${role}`,
    `Task: ${task}`,
    '',
    'Constraints:',
    ...constraints.map((c) => `- ${c}`),
    '',
    'Project context (open files):',
    ctx.openFiles ? ctx.openFiles : '(none detected)',
    'Note: This is a list of filenames/paths only; file contents were not provided unless included below.',
    '',
    'Project context (imports from this file):',
    ctx.importLines ? ['```', ctx.importLines, '```'].join('\n') : '(none detected)',
    '',
    'Editor context:',
    'Selected:',
    ctx.selectedText || '(no selection)',
    '',
    'Before selection:',
    ctx.beforeText,
    '',
    'After selection:',
    ctx.afterText,
    '',
    'Input context:',
    inputContext,
    '',
    `Output: ${output}`
  ].join('\n');
}
