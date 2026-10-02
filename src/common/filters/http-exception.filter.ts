import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Global exception filter.
 *
 * - HttpException → pass through with a consistent JSON shape.
 * - Everything else → log the full error server-side, return a
 *   safe generic 500 body (no stack trace, no DB details).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      // NestJS exceptions already carry a safe payload — forward it.
      response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body, error: HttpStatus[status] }
          : body,
      );
      return;
    }

    // ---------- unexpected / non-Http error ----------
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
