import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { randomUUID } from "crypto";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = req.headers["x-correlation-id"] || randomUUID();
    req.correlationId = correlationId;

    const { method, url } = req;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          console.log(
            JSON.stringify({
              level: "info",
              correlationId,
              method,
              url,
              statusCode: res.statusCode,
              durationMs: Date.now() - startedAt,
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (err) => {
          console.error(
            JSON.stringify({
              level: "error",
              correlationId,
              method,
              url,
              error: err.message,
              statusCode: err.status || 500,
              durationMs: Date.now() - startedAt,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
