import { Test, TestingModule } from '@nestjs/testing';
import { PdfToExcelController } from './pdf-to-excel.controller';

describe('PdfToExcelController', () => {
  let controller: PdfToExcelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfToExcelController],
    }).compile();

    controller = module.get<PdfToExcelController>(PdfToExcelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
