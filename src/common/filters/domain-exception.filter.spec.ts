import { HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { BusinessRuleError, NotFoundError, UnauthorizedError, ValidationError } from '../errors/domain.errors';

function buildHost(response: any) {
  return { switchToHttp: () => ({ getResponse: () => response }) } as any;
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  function respond(exception: any) {
    const response: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    filter.catch(exception, buildHost(response));
    return response;
  }

  it('should map ValidationError to 400', () => {
    const response = respond(new ValidationError('inválido'));
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('should map NotFoundError to 404', () => {
    const response = respond(new NotFoundError('não encontrado'));
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should map UnauthorizedError to 401', () => {
    const response = respond(new UnauthorizedError('não autorizado'));
    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('should map BusinessRuleError to 422', () => {
    const response = respond(new BusinessRuleError('regra violada'));
    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'BusinessRuleError',
      message: 'regra violada',
    });
  });

  it('should map unknown domain errors to 500', () => {
    class UnknownDomainError extends Error {
      name = 'UnknownDomainError';
    }
    const response = respond(new UnknownDomainError('erro desconhecido'));
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
