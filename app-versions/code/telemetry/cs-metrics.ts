import type { CsAttributes } from './cs-spans';

export interface CsHistogram {
    record(value: number, attributes?: CsAttributes): void;
}

export interface CsMetrics {
    histogram(name: string): CsHistogram;
}
