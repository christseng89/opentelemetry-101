import type { CsAttributes } from './cs-spans';

export interface CsLogger {
    debug(message: string, attributes?: CsAttributes): void;
    info(message: string, attributes?: CsAttributes): void;
    warn(message: string, attributes?: CsAttributes): void;
    error(message: string, error?: unknown, attributes?: CsAttributes): void;
}
