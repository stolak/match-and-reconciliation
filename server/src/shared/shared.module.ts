import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import {
  ReconciliationSource,
  ReconciliationSourceSchema,
} from 'src/comparism/reconciliation-source.schema';

const allSchema = [
  { name: ReconciliationSource.name, schema: ReconciliationSourceSchema },
];

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature(allSchema),
  ],
  exports: [MongooseModule],
})
export class SharedModule {}
