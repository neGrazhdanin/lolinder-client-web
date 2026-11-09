#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const { tool_input: input } = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const path = input?.file_path;
if (!path) process.exit(0);

const rel = relative(root, resolve(root, path));
if (rel.startsWith('src/shared/api/generated/')) {
  console.error(
    `${rel} is generated from the backend OpenAPI spec. Change the API, then run \`pnpm gen:api\` against the running backend.`,
  );
  process.exit(2);
}
