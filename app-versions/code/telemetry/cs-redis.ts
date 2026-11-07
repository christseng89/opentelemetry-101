export interface CsRedis {
    ping(): Promise<string>;
    hSet(key: string, field: string, value: string): Promise<number>;
    hGet(key: string, field: string): Promise<string | null>;
    hDel(key: string, field: string): Promise<number>;
    close(): Promise<void>;
}

export type CsRedisImplementation = 'redis' | 'ioredis';

export interface CsRedisFactory {
    create(url: string, implementation: CsRedisImplementation): Promise<CsRedis>;
}
