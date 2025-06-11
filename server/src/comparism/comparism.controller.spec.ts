import { Test, TestingModule } from '@nestjs/testing';
import { ComparismController } from './comparism.controller';

describe('ComparismController', () => {
  let controller: ComparismController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparismController],
    }).compile();

    controller = module.get<ComparismController>(ComparismController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
