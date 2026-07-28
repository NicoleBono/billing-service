import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  BusinessRuleError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }

  private resolveStatus(exception: DomainError): number {
    if (exception instanceof ValidationError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof BusinessRuleError) return HttpStatus.UNPROCESSABLE_ENTITY;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
