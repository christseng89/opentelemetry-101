import { logs, SeverityNumber, type Attributes } from '@opentelemetry/api';
import type { TelemetryLogger } from './types';

export class OTelLogger implements TelemetryLogger {
    private readonly logger;

    constructor(serviceName: string) {
        this.logger = logs.getLogger(serviceName);
    }

    debug(message: string, attributes?: Attributes): void {
        this.emit(SeverityNumber.DEBUG, 'DEBUG', message, attributes);
    }

    info(message: string, attributes?: Attributes): void {
        this.emit(SeverityNumber.INFO, 'INFO', message, attributes);
    }

    warn(message: string, attributes?: Attributes): void {
        this.emit(SeverityNumber.WARN, 'WARN', message, attributes);
    }

    error(message: string, error?: unknown, attributes?: Attributes): void {
        const errorAttributes: Attributes = { ...attributes };
        if (error instanceof Error) {
            errorAttributes['error.type'] = error.name;
            errorAttributes['error.message'] = error.message;
            if (error.stack) {
                errorAttributes['error.stack'] = error.stack;
            }
        }
        this.emit(SeverityNumber.ERROR, 'ERROR', message, errorAttributes);
    }

    private emit(
        severityNumber: SeverityNumber,
        severityText: string,
        body: string,
        attributes?: Attributes,
    ): void {
        this.logger.emit({ severityNumber, severityText, body, attributes });
    }
}
