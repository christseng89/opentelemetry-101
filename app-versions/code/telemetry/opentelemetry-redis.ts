import type { CsRedis } from './cs-redis';

type RedisClient = {
    ping(): Promise<string>;
    hSet(key: string, field: string, value: string): Promise<number>;
    hGet(key: string, field: string): Promise<string | null>;
    hDel(key: string, field: string): Promise<number>;
    quit(): Promise<string>;
};

class OpenTelemetryRedis implements CsRedis {
    constructor(private readonly client: RedisClient) {}

    ping(): Promise<string> {
        return this.client.ping();
    }

    hSet(key: string, field: string, value: string): Promise<number> {
        return this.client.hSet(key, field, value);
    }

    hGet(key: string, field: string): Promise<string | null> {
        return this.client.hGet(key, field);
    }

    hDel(key: string, field: string): Promise<number> {
        return this.client.hDel(key, field);
    }

    async close(): Promise<void> {
        await this.client.quit();
    }
}

export const createOpenTelemetryRedis = async (url: string): Promise<CsRedis> => {
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', () => undefined);
    await client.connect();
    return new OpenTelemetryRedis(client);
};
