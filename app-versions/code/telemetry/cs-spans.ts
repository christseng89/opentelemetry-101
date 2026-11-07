export type CsAttributeValue = string | number | boolean | readonly string[] | readonly number[] | readonly boolean[];
export type CsAttributes = Record<string, CsAttributeValue>;

export interface CsSpan {
    traceId(): string | undefined;
    setAttribute(key: string, value: CsAttributeValue): void;
    setAttributes(attributes: CsAttributes): void;
    recordException(error: unknown): void;

    end(): void;
}

export type CsSpanOperation<T> = (span: CsSpan) => Promise<T> | T;
