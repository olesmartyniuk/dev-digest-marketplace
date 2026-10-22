---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Flags direct fetch to the Slack webhook in service.ts as an external call that bypasses the ports/Container
- Recommends adding an interface (port) in the shared ports file
- Recommends implementation under adapters/<name>/ and a lazily-built Container getter with a test override slot
- Says service should consume it via this.container.<x> and never import the adapter class
- Flags process.env.SLACK_WEBHOOK_URL read inside the service (secrets via SecretsProvider/config)
- Assigns explicit severity levels

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
