import { ChatMessage } from '../prompt/promptBuilder';
import { EditorContext } from '../prompt/contextBuilder';

export type MoeCriticCommand = 'generate' | 'refactor';

export function buildCriticMessages(command: MoeCriticCommand, ctx: EditorContext, writerOutput: string): ChatMessage[] {
  const system =
    'You are DIOTEC 360 IA Critic. Your job is to review the Writer output for correctness, safety, and alignment with the task.\n' +
    'Rules:\n' +
    '- Do NOT rewrite the full solution. Provide review only.\n' +
    '- Do NOT claim you read files you were not shown. You only have editor context, imports, and open file paths.\n' +
    '- Be concise and practical.\n' +
    '- Output Markdown.\n' +
    'Return this structure:\n' +
    '## Risk\n<low|medium|high>\n\n## Issues\n- ...\n\n## Suggestions\n- ...';

  const user = [
    `Command: ${command}`,
    `Language: ${ctx.languageId}`,
    `Workspace: ${ctx.workspaceName || '(none)'}`,
    `File: ${ctx.relativePath || ctx.fileName}`,
    '',
    'Open files (paths only):',
    ctx.openFiles ? ctx.openFiles : '(none detected)',
    '',
    'Imports (from this file):',
    ctx.importLines ? ['```', ctx.importLines, '```'].join('\n') : '(none detected)',
    '',
    'Editor context (selected):',
    ctx.selectedText || '(no selection)',
    '',
    'Writer output to review:',
    '```',
    writerOutput.trim(),
    '```',
    '',
    'Review for:',
    command === 'refactor'
      ? '- behavior preservation\n- unintended changes\n- correctness\n- style consistency\n- missing edge cases'
      : '- correctness\n- missing imports/usages\n- style consistency\n- potential security pitfalls\n- hallucinations'
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}
