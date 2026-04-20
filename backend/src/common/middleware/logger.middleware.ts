import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now()

    const body = { ...req.body };
    if (body.password) body.password = '***';

    this.logger.log(`--> ${method} ${originalUrl} [${ip}] ${Object.keys(body).length ? JSON.stringify(body) : ''}`);

    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      const logFn = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      this.logger[logFn](`<-- ${method} ${originalUrl} ${statusCode} (${ms}ms)`);
    });

    next();
  }
}
