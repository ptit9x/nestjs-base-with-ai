import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DB_FACADE } from './db-facade.token.js';
import { USERS_REPOSITORY } from '../modules/users/users.repository.js';
import { PrismaUsersRepository } from './prisma-users.repository.js';
import { createDb, type Db } from '../prisma/db.js';

@Global()
@Module({
  providers: [
    {
      provide: DB_FACADE,
      useFactory: (config: ConfigService): Db => {
        const url = config.getOrThrow<string>('database.url');
        return createDb(url);
      },
      inject: [ConfigService],
    },
    {
      provide: USERS_REPOSITORY,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [DB_FACADE, USERS_REPOSITORY],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DB_FACADE) private readonly db: Db) {}

  async onApplicationShutdown() {
    await this.db.close();
  }
}
