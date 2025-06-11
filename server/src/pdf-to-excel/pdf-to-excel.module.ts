import { Module } from '@nestjs/common';
import { PdfToExcelService } from './pdf-to-excel.service';
import { PdfToExcelController } from './pdf-to-excel.controller';
@Module({
  imports: [],
  controllers: [PdfToExcelController],
  providers: [PdfToExcelService],
})
export class PdfToExcelModule {}
