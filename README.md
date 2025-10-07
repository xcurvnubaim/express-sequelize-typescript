## Logging

Laravel-like logging config lives in `configs/logging.ts`.

Env vars control channels and levels:

- `APP_LOG_LEVEL`: debug | info | warn | error (default: info)
- `LOG_CHANNEL`: stack | console | file | sentry | newrelic (default: stack)
- `LOG_STACK_CHANNELS`: comma-separated list (e.g., `console,file`)
- `LOG_CONSOLE_ENABLED`: true/false
- `LOG_FILE_ENABLED`: true/false
- `LOG_FILE_PATH`: path to write logs (default `./storage/logs/app.log`)
- `SENTRY_ENABLED`: true/false
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`
- `NEW_RELIC_ENABLED`: true/false
- `NEW_RELIC_APP_NAME`, `NEW_RELIC_LICENSE_KEY`

Usage:

```ts
import { config } from "./configs";
import { createLogger } from "./src/lib/logger";

const logger = createLogger(config.logging);
logger.info("Hello world");
```

Switch to file logs only:

```env
LOG_CHANNEL=file
LOG_FILE_PATH=./storage/logs/app.log
```

Enable Sentry (requires `@sentry/node`):

```env
SENTRY_ENABLED=true
SENTRY_DSN=your-dsn
LOG_CHANNEL=stack
LOG_STACK_CHANNELS=console,sentry
```

Enable New Relic (requires `newrelic` and agent config):

```env
NEW_RELIC_ENABLED=true
LOG_CHANNEL=newrelic
```


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
