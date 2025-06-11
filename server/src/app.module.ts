import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ComparismModule } from './comparism/comparism.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';

import { PdfToExcelModule } from './pdf-to-excel/pdf-to-excel.module';

@Module({
  imports: [
    UsersModule,
    ComparismModule,
    SharedModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE),
    AuthModule,
    PdfToExcelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
