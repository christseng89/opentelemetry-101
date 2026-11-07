import { logs, SeverityNumber } from '@opentelemetry/api';
import type { CsAttributes } from './cs-spans';
import type { CsLogger } from './cs-loggers';

export class OpenTelemetryLogger implements CsLogger {
    private readonly logger;

    constructor(serviceName: string) {
        this.logger = logs.getLogger(serviceName);
    }

    debug(message: string, attributes?: CsAttributes): void {
        this.emit(SeverityNumber.DEBUG, 'DEBUG', message, attributes);
    }

    info(message: string, attributes?: CsAttributes): void {
        this.emit(SeverityNumber.INFO, 'INFO', message, attributes);
    }

    warn(message: string, attributes?: CsAttributes): void {
        this.emit(SeverityNumber.WARN, 'WARN', message, attributes);
    }

    error(message: string, error?: unknown, attributes?: CsAttributes): void {
        const errorAttributes: CsAttributes = { ...attributes };
        if (error instanceof Error) {
            errorAttributes['error.type'] = error.name;
            errorAttributes['error.message'] = error.message;
            if (error.stack) {
                errorAttributes['error.stack'] = error.stack;
            }
        }
        this.emit(SeverityNumber.ERROR, 'ERROR', message, errorAttributes);
    }

    private emit(severityNumber: SeverityNumber, severityText: string, body: string, attributes?: CsAttributes): void {
        this.logger.emit({ severityNumber, severityText, body, attributes });
    }
}
