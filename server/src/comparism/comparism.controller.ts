import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ComparismService } from './comparism.service';
import { CreateReconciliationInput } from './inputs/create-reconciliation-input';
import { ReconciliationSource } from './reconciliation-source.schema';
import { CreateMultipleReconciliationInput } from './inputs/create-multiple-reconciliation-input';
import { UpdateReconciliationInput } from './inputs/updatereconciliation-input';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { v4 as uuid } from 'uuid';
interface inputType {
  record1: string;
  record2: string;
}
@UseGuards(JwtAuthGuard)
@Controller('compare')
export class ComparismController {
  constructor(private readonly comparismService: ComparismService) {}

  @Post('create')
  async create(
    @Body() input: CreateReconciliationInput,
    @Req() request: any,
  ): Promise<ReconciliationSource> {
    const { user } = request;
    return this.comparismService.create(input, user.userId);
  }

  @Post('records/:id')
  async compareRecordsOptimised(@Param('id') id: string): Promise<null> {
    // return this.comparismService.compareRecordsOptimised(id);
    // compareRecords5Old
    return this.comparismService.compareRecords5Old(id);
  }

  @Get('distinct')
  async getDistinct(
    @Req() request: any,
  ): Promise<{ description: string; refId: string }[]> {
    const { user } = request;
    return this.comparismService.getDistinctDescriptionsAndRefIds(user.userId);
  }

  @Post('update')
  async update(
    @Body() record: UpdateReconciliationInput,
  ): Promise<ReconciliationSource> {
    return this.comparismService.update(record);
  }

  @Post('delete')
  async deleteMultiple(
    @Body('ids') ids: string[],
  ): Promise<{ message: string }> {
    return this.comparismService.delete(ids);
  }

  @Get('records-sources/:id')
  async getRecordsByIdAndSources(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{
    source: ReconciliationSource[];
    target: ReconciliationSource[];
    refId: string;
  }> {
    const { user } = request;
    const source = await this.comparismService.getRecordsByRefIdandSource(
      id,
      user.userId,
      true,
    );
    const target = await this.comparismService.getRecordsByRefIdandSource(
      id,
      user.userId,
      false,
    );
    return { source, target, refId: id };
  }

  @Post('create-multiple')
  async createMultiple(
    @Body('source') source: CreateMultipleReconciliationInput,
    @Body('target') target: CreateMultipleReconciliationInput,
    @Body('refId') ref: string,
    @Req() request: any,
  ): Promise<{
    source: ReconciliationSource[];
    target: ReconciliationSource[];
    refId: string;
  }> {
    const { user } = request;
    const refId = ref || uuid();
    console.log(source);
    console.log(target);
    const resSource = await this.comparismService.createMultiple(
      user.userId,
      source,
      refId,
      true,
    );
    const resTarget = await this.comparismService.createMultiple(
      user.userId,
      target,
      refId,
      false,
    );
    return { source: resSource, target: resTarget, refId };
  }

  //Experiment

  @Get('records/:id')
  async getRecordsByRefId(
    @Param('id') id: string,
  ): Promise<ReconciliationSource[]> {
    return this.comparismService.getRecordsByRefId(id);
  }
  @Post('single')
  async compare(
    @Body('record1') record1: string,
    @Body('record2') record2: string,
  ): Promise<string> {
    return this.comparismService.compareRecords(record1, record2);
  }

  @Post('multiple')
  async compare2(@Body('record') record: inputType[]): Promise<string> {
    return this.comparismService.compareRecords2(record);
  }
  @Post('multiple-file')
  async compare3(
    @Body('record1') record1: inputType[],
    @Body('record2') record2: inputType[],
  ): Promise<string> {
    return this.comparismService.compareRecords3(record1, record2);
    //
  }
}
