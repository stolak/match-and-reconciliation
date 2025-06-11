import { Test, TestingModule } from '@nestjs/testing';
import { PdfToExcelService } from './pdf-to-excel.service';

describe('PdfToExcelService', () => {
  let service: PdfToExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfToExcelService],
    }).compile();

    service = module.get<PdfToExcelService>(PdfToExcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
