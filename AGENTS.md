# AGENTS.md

## Working mode
- Work only on the local repository.
- Never push to GitHub.
- Never open or update pull requests.
- Never trigger GitHub Actions intentionally.
- Never use Vercel or any preview deployment workflow.
- Never publish, deploy, or verify remote environments.

## Expected output
When a task is complete, return:
1. A short summary of changes
2. The list of modified files
3. Local test commands to run
4. A recommended commit message

## Allowed actions
- Edit local files
- Create local files
- Run local lint/build/test commands when relevant

## Forbidden actions
- git push
- gh pr create
- gh pr comment
- any Vercel command
- any remote deployment action