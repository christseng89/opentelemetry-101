import type { CsAttributes, CsSpan, CsSpanOperation } from './cs-spans';

export interface CsTracer {
    run<T>(name: string, operation: CsSpanOperation<T>, attributes?: CsAttributes): Promise<T>;
    start(name: string, attributes?: CsAttributes): CsSpan;
}
