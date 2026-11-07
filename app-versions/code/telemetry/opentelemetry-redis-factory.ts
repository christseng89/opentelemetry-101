import type { CsRedis, CsRedisFactory, CsRedisImplementation } from './cs-redis';
import { createOpenTelemetryIORedis } from './opentelemetry-ioredis';
import { createOpenTelemetryRedis } from './opentelemetry-redis';

export class OpenTelemetryRedisFactory implements CsRedisFactory {
    create(url: string, implementation: CsRedisImplementation): Promise<CsRedis> {
        return implementation === 'ioredis'
            ? createOpenTelemetryIORedis(url)
            : createOpenTelemetryRedis(url);
    }
}
