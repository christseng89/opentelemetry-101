import { createRequire } from 'node:module';
import type { CsRedis } from './cs-redis';

type IORedisClient = {
    ping(): Promise<string>;
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hdel(key: string, field: string): Promise<number>;
    quit(): Promise<string>;
};

class OpenTelemetryIORedis implements CsRedis {
    constructor(private readonly client: IORedisClient) {}

    ping(): Promise<string> {
        return this.client.ping();
    }

    hSet(key: string, field: string, value: string): Promise<number> {
        return this.client.hset(key, field, value);
    }

    hGet(key: string, field: string): Promise<string | null> {
        return this.client.hget(key, field);
    }

    hDel(key: string, field: string): Promise<number> {
        return this.client.hdel(key, field);
    }

    async close(): Promise<void> {
        await this.client.quit();
    }
}

export const createOpenTelemetryIORedis = async (url: string): Promise<CsRedis> => {
    const require = createRequire(`${process.cwd()}/package.json`);
    const Redis = require('ioredis') as new (url: string) => IORedisClient;
    return new OpenTelemetryIORedis(new Redis(url));
};
