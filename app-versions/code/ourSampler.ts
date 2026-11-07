import { Attributes, Context, Link, SpanKind } from "@opentelemetry/api";
import { Sampler, SamplingResult, SamplingDecision } from "@opentelemetry/sdk-trace";


export class OurSampler implements Sampler {
    shouldSample(context: Context, traceId: string, spanName: string, spanKind: SpanKind, attributes: Attributes, links: Link[]): SamplingResult {
        if (attributes['url.path'] === '/metrics') {
            return {
                decision: SamplingDecision.NOT_RECORD,
            }
        }

        return {
            decision: SamplingDecision.RECORD_AND_SAMPLED,
        }
    }
}
