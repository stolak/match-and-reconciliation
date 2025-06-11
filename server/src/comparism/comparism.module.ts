import { Module } from '@nestjs/common';
import { ComparismController } from './comparism.controller';
import { ComparismService } from './comparism.service';
import { ComparismResolver } from './comparism.resolver';
import { ReconciliationSourceRepository } from './reconciliation-source.repository';

@Module({
  controllers: [ComparismController],
  providers: [
    ComparismService,
    ComparismResolver,
    ReconciliationSourceRepository,
  ],
})
export class ComparismModule {}
