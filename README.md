# dev-digest-marketplace

Claude Code plugin marketplace for the team.

## Usage

```
claude plugin marketplace add <org>/dev-digest-marketplace
claude plugin install example-plugin@dev-digest-marketplace
```

## Local development

```
claude plugin validate .
claude plugin marketplace add ./
```

Changes are picked up after `/reload-plugins`.

## Adding a new plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` plus `skills/` and `agents/`.
2. Add an entry to `.claude-plugin/marketplace.json` (`name` must match plugin.json).
3. Bump `version` in plugin.json, otherwise users will not receive the update.
4. Run `claude plugin validate . --strict`.

## Releasing a plugin

1. In a PR, bump `version` in `plugins/<name>/.claude-plugin/plugin.json` (semver) and add an entry to `CHANGELOG.md`.
2. CI (`validate.yml`) must pass; merge to `main`.
3. In GitHub, go to Actions > Release > Run workflow and enter the plugin directory name.
   It validates, creates the `<name>--v<version>` tag and a GitHub Release.
4. Users receive the update via `claude plugin update <name>@dev-digest-marketplace`
   (or automatically if auto-update is enabled for the marketplace).

Users only get updates when `version` changes, so always bump it.

## Rolling back

Never lower the version number. Revert the bad commit (`git revert`), bump `version` to the next
patch (e.g. 1.2.0 to 1.2.1), and release as usual. For an emergency pin, a marketplace entry can
use a `github` or `git-subdir` source with `ref` or `sha` pointing at a known-good tag.
